<<<<<<< HEAD
# unsupervised_project
=======
# AgroSynapse: Autonomous Precision Irrigation Zoning

AgroSynapse is a patent-level MVP SaaS platform designed for autonomous precision irrigation. It utilizes unsupervised spectral image segmentation to divide agricultural fields into intelligent zones and generate precise Variable Rate Irrigation (VRI) adjustments.

## 🚀 Overview

The system processes multi-spectral aerial imagery (RGB, NIR, Red-Edge, Thermal) to identify crop stress and moisture levels. By fusing spectral indices (like NDVI and WDI) with texture features (GLCM), it automatically segments fields into zones without requiring ground sensors.

### Key Features
- **Unsupervised Zoning**: Uses state-of-the-art KMeans++ clustering for automated management zone segmentation.
- **Spectral Fusion**: Intelligently fuses 6-band imagery (Red, Green, Blue, NIR, Red-Edge, Thermal).
- **Advanced Evaluation**: Real-time calculation of **Silhouette Score**, **Calinski-Harabasz**, and **Davies-Bouldin** indices to validate cluster quality.
- **Texture-Aware Analysis**: Leverages GLCM entropy and contrast to distinguish between canopy gaps and true plant stress.
- **VRI Optimization**: Automated Variable Rate Irrigation recommendations with up to 30% estimated water savings.
- **AI Explainability**: Dynamic reasoning logs explaining the spectral and textural drivers for every decision.

---

## 🛠 Tech Stack

- **Backend**: Python 3.9+, FastAPI, Scikit-learn, OpenCV, Rasterio, Motor.
- **Frontend**: React (Vite), Leaflet.js, Recharts, Lucide-React.
- **Database**: MongoDB.

---

## 📁 Project Structure

```text
unsuper_project/
├── backend/            # FastAPI & ML Pipeline
│   ├── api/            # API endpoints
│   ├── core/           # Spectral indices & Clustering logic
│   ├── database/       # MongoDB connections
│   └── main.py         # Application entry point
├── frontend/           # React Web Application
│   ├── src/            # Components, Styles, and UI logic
│   └── App.jsx         # Main Dashboard
├── simulator/          # Synthetic Data Generator
│   └── synthetic_gen.py
└── start_servers.sh    # Script to run both servers
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Python 3.9+**
- **Node.js (v16+) & npm**
- **MongoDB** (Ensure a local instance is running on `mongodb://localhost:27017` or update the environment variables).

### 2. Manual Installation (Optional - Automated by Start Script)

**Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install
```

---

## 🏃 How to Run

I have provided a one-click script to launch the entire environment.

1. **Make the script executable:**
   ```bash
   chmod +x start_servers.sh
   ```

2. **Run the script:**
   ```bash
   ./start_servers.sh
   ```

3. **Access the platform:**
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🎯 Using the Application

### 1. Running the Demo
- Once the dashboard loads, click the **"Start Demo Analysis"** or **"Run AI Irrigation Analysis"** button.
- The system will use the simulator to generate a synthetic field and process it immediately.

### 2. Understanding the Map
- **NDVI Heatmap**: Shows the relative health and density of the vegetation.
- **Irrigation Zones**: Displays the distinct clusters identified by the AI.
- **WDI (Water Deficit Index)**: Visualizes where the field is experiencing high temperature or low moisture stress.

### 3. Dashboard Analytics
- **Spectral Map**: Interactive Leaflet map with layer toggles for NDVI, WDI, and AI Zones.
- **Explainability Layer**: Real-time natural language reasoning derived from spectral and textural data.
- **Yield Projection**: Dynamic Recharts area chart showing optimized vs. traditional growth curves.
- **Advanced Evaluation Tab**: High-level statistical validation (Silhouette, Calinski, Davies-Bouldin) and Efficiency metrics (Water Liters Saved, Carbon Impact).

### 4. Uploading Custom Data
- Use the "Upload Aerial Data" button to process your own multi-spectral GeoTIFF files. 
- **Requirement**: Must be a 6-band GeoTIFF (Red, Green, Blue, NIR, Red-Edge, Thermal).

---

## 📊 Documentation for Developers

- **ML Pipeline**: The logic resides in `backend/core/pipeline.py`. You can adjust clustering parameters or add new spectral indices here.
- **Synthetic Data**: To modify the demo field patterns, edit `simulator/synthetic_gen.py`.
- **Database**: Analysis results are automatically saved to the `agrosynapse` database in MongoDB under the `analysis_history` collection.

---

*Developed for the Autonomous Precision Irrigation Patent-Level MVP.*
>>>>>>> 271fd63 (Initial commit: add project files with ignore rules)
