"""
MatruSakhi Database Connection
Async MongoDB connection using Motor driver.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_database():
    """Create connection to MongoDB."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    print(f"[OK] Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_database_connection():
    """Close connection to MongoDB."""
    global client
    if client:
        client.close()
        print("[CLOSED] MongoDB connection closed.")


def get_database():
    """Get the database instance."""
    return db


def get_collection(collection_name: str):
    """Get a specific collection from the database."""
    return db[collection_name]
