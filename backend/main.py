from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid
import numpy as np
import cv2
from core.pipeline import IrrigationPipeline
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from database.mongo import save_analysis_result
from datetime import datetime

app = FastAPI(title="Autonomous Precision Irrigation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Serve results as static files for the frontend to access images
app.mount("/static", StaticFiles(directory=RESULTS_DIR), name="static")

@app.get("/")
async def root():
    return {"message": "Precision Irrigation API is running"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"file_id": file_id, "file_path": file_path}

@app.post("/analyze")
async def analyze(file_path: str = Form(...), method: str = Form("kmeans"), n_clusters: int = Form(5)):
    try:
        pipeline = IrrigationPipeline(file_path)
        results = pipeline.process(method=method, n_clusters=n_clusters)
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to process image: {str(e)}"}
    
    # Generate visualization images
    file_id = str(uuid.uuid4())
    
    # Save Cluster Map
    clusters = results["clusters"]
    plt.figure(figsize=(10, 10))
    plt.imshow(clusters, cmap='tab20')
    plt.axis('off')
    cluster_img_path = os.path.join(RESULTS_DIR, f"{file_id}_clusters.png")
    plt.savefig(cluster_img_path, bbox_inches='tight', pad_inches=0)
    plt.close()
    
    # Save NDVI Heatmap
    ndvi = results["indices"]["ndvi"]
    plt.figure(figsize=(10, 10))
    plt.imshow(ndvi, cmap='RdYlGn')
    plt.axis('off')
    ndvi_img_path = os.path.join(RESULTS_DIR, f"{file_id}_ndvi.png")
    plt.savefig(ndvi_img_path, bbox_inches='tight', pad_inches=0)
    plt.close()
    
    # Save WDI Heatmap
    wdi = results["indices"]["wdi"]
    plt.figure(figsize=(10, 10))
    plt.imshow(wdi, cmap='YlOrRd')
    plt.axis('off')
    wdi_img_path = os.path.join(RESULTS_DIR, f"{file_id}_wdi.png")
    plt.savefig(wdi_img_path, bbox_inches='tight', pad_inches=0)
    plt.close()
    
    # Get Advanced Metrics from Pipeline
    advanced = results["advanced_metrics"]
    
    ts = int(datetime.utcnow().timestamp() * 1000)
    
    # Prepare for DB
    db_record = {
        "id": file_id,
        "timestamp": datetime.utcnow().isoformat(),
        "recommendations": results["recommendations"],
        "layers": {
            "clusters": f"/static/{file_id}_clusters.png?t={ts}",
            "ndvi": f"/static/{file_id}_ndvi.png?t={ts}",
            "wdi": f"/static/{file_id}_wdi.png?t={ts}"
        },
        "stats": {
            "avg_ndvi": advanced["field_stats"]["avg_ndvi"],
            "avg_wdi": advanced["yield_projection"]["stress_score"] / 10,
            "texture_variance": advanced["field_stats"]["entropy_score"],
            "water_savings": advanced["water_savings"]["percentage"],
            "water_liters": advanced["water_savings"]["liters_hectare"],
            "efficiency_score": advanced["water_savings"]["efficiency_score"],
            "yield_improvement": advanced["yield_projection"]["improvement"],
            "confidence_score": advanced["yield_projection"]["confidence"],
            "agronomic_insight": advanced["yield_projection"]["insight"],
            "coverage_pct": advanced["field_stats"]["coverage_pct"],
            "stress_pct": advanced["field_stats"]["stress_pct"],
            "thermal_variance": advanced["field_stats"]["thermal_variance"],
            "clustering_metrics": advanced["clustering_metrics"]
        }
    }
    
    try:
        await save_analysis_result(db_record)
    except Exception as e:
        print(f"DB Error: {e}")
        
    if "_id" in db_record:
        del db_record["_id"]
        
    return db_record

@app.post("/demo")
async def run_demo():
    demo_path = "sample_data/synthetic_field.tif"
    if not os.path.exists(demo_path):
        return {"error": f"Sample data not found at {os.path.abspath(demo_path)}. Please run the simulator first."}
    
    # Pass explicit primitive values to avoid passing FastAPI Form objects
    return await analyze(file_path=demo_path, method="kmeans", n_clusters=5)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
