"""
MatruSakhi Health Record Model
MongoDB document structure for health vitals, checkups, and pregnancy tracking.
"""

from datetime import datetime, timezone
from typing import Optional


def create_health_record_document(
    user_id: str,
    record_type: str,
    data: dict,
    notes: Optional[str] = None,
) -> dict:
    """
    Create a health record document.

    record_type options:
    - vitals: blood pressure, weight, temperature, heart rate
    - checkup: prenatal/postnatal checkup details
    - lab_result: blood test, urine, ultrasound results
    - symptom: symptoms logged by the user
    - medication: medication tracking
    - diet: daily diet / nutrition log
    - exercise: physical activity log
    - mood: mood/mental health tracking
    - kick_count: fetal kick counting
    """
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "record_type": record_type,
        "data": data,
        "notes": notes,
        "created_at": now,
        "updated_at": now,
    }


def create_milestone_document(
    user_id: str,
    week: int,
    title: str,
    description: str,
    category: str = "pregnancy",
    is_completed: bool = False,
) -> dict:
    """Create a pregnancy milestone document."""
    return {
        "user_id": user_id,
        "week": week,
        "title": title,
        "description": description,
        "category": category,
        "is_completed": is_completed,
        "completed_at": None,
        "created_at": datetime.now(timezone.utc),
    }


def health_record_serializer(record: dict) -> dict:
    """Serialize a health record for API response."""
    return {
        "id": str(record["_id"]),
        "user_id": record.get("user_id", ""),
        "record_type": record.get("record_type", ""),
        "data": record.get("data", {}),
        "notes": record.get("notes"),
        "created_at": record.get("created_at", ""),
        "updated_at": record.get("updated_at", ""),
    }


def milestone_serializer(milestone: dict) -> dict:
    """Serialize a milestone for API response."""
    return {
        "id": str(milestone["_id"]),
        "user_id": milestone.get("user_id", ""),
        "week": milestone.get("week", 0),
        "title": milestone.get("title", ""),
        "description": milestone.get("description", ""),
        "category": milestone.get("category", "pregnancy"),
        "is_completed": milestone.get("is_completed", False),
        "completed_at": milestone.get("completed_at"),
        "created_at": milestone.get("created_at", ""),
    }
