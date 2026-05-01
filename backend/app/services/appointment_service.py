"""
MatruSakhi Appointment Service
Business logic for appointment scheduling and management.
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.appointment import create_appointment_document, appointment_serializer

APPOINTMENTS_COLLECTION = "appointments"


async def create_appointment(user_id: str, data: dict) -> dict:
    """Create a new appointment."""
    appts = get_collection(APPOINTMENTS_COLLECTION)
    doc = create_appointment_document(
        user_id=user_id,
        title=data["title"],
        appointment_type=data["appointment_type"],
        date=data["date"],
        time=data["time"],
        provider_name=data.get("provider_name"),
        provider_type=data.get("provider_type"),
        location=data.get("location"),
        notes=data.get("notes"),
    )
    result = await appts.insert_one(doc)
    doc["_id"] = result.inserted_id

    await appts.create_index([("user_id", 1), ("date", 1)])
    return appointment_serializer(doc)


async def get_appointments(
    user_id: str,
    status: Optional[str] = None,
    upcoming_only: bool = False,
) -> dict:
    """Get appointments for a user."""
    appts = get_collection(APPOINTMENTS_COLLECTION)
    query = {"user_id": user_id}

    if status:
        query["status"] = status

    if upcoming_only:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["date"] = {"$gte": today}
        query["status"] = "scheduled"

    total = await appts.count_documents(query)
    cursor = appts.find(query).sort("date", 1)
    items = []
    async for appt in cursor:
        items.append(appointment_serializer(appt))

    return {"appointments": items, "total": total}


async def get_appointment_by_id(user_id: str, appointment_id: str) -> Optional[dict]:
    """Get a single appointment."""
    appts = get_collection(APPOINTMENTS_COLLECTION)
    appt = await appts.find_one({"_id": ObjectId(appointment_id), "user_id": user_id})
    if appt:
        return appointment_serializer(appt)
    return None


async def update_appointment(user_id: str, appointment_id: str, update_data: dict) -> Optional[dict]:
    """Update an appointment."""
    appts = get_collection(APPOINTMENTS_COLLECTION)
    update_fields = {"updated_at": datetime.now(timezone.utc)}

    for field in ["title", "date", "time", "provider_name", "location", "notes", "status"]:
        if field in update_data and update_data[field] is not None:
            update_fields[field] = update_data[field]

    result = await appts.update_one(
        {"_id": ObjectId(appointment_id), "user_id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return None

    return await get_appointment_by_id(user_id, appointment_id)


async def delete_appointment(user_id: str, appointment_id: str) -> bool:
    """Delete an appointment."""
    appts = get_collection(APPOINTMENTS_COLLECTION)
    result = await appts.delete_one({"_id": ObjectId(appointment_id), "user_id": user_id})
    return result.deleted_count > 0
