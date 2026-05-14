from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "agrosynapse"

# Add server selection timeout to avoid hanging
client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
db = client[DATABASE_NAME]

async def save_analysis_result(result_data):
    try:
        collection = db["analysis_history"]
        # Add a timeout to the insertion
        await collection.insert_one(result_data)
    except Exception as e:
        print(f"MongoDB Insert Error (Non-critical): {e}")

async def get_analysis_history():
    collection = db["analysis_history"]
    cursor = collection.find().sort("timestamp", -1)
    return await cursor.to_list(length=100)
