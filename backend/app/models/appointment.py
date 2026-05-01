"""
MatruSakhi Appointment Model
MongoDB document structure for appointment scheduling.
"""

from datetime import datetime, timezone
from typing import Optional


def create_appointment_document(
    user_id: str,
    title: str,
    appointment_type: str,
    date: str,
    time: str,
    provider_name: Optional[str] = None,
    provider_type: Optional[str] = None,
    location: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict:
    """
    Create an appointment document.

    appointment_type options:
    - prenatal_checkup, postnatal_checkup
    - ultrasound, lab_test
    - vaccination
    - consultation
    - emergency
    - other
    """
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "title": title,
        "appointment_type": appointment_type,
        "date": date,
        "time": time,
        "provider_name": provider_name,
        "provider_type": provider_type,
        "location": location,
        "notes": notes,
        "status": "scheduled",  # scheduled, completed, cancelled, missed
        "reminder_sent": False,
        "created_at": now,
        "updated_at": now,
    }


def appointment_serializer(appt: dict) -> dict:
    """Serialize an appointment for API response."""
    return {
        "id": str(appt["_id"]),
        "user_id": appt.get("user_id", ""),
        "title": appt.get("title", ""),
        "appointment_type": appt.get("appointment_type", ""),
        "date": appt.get("date", ""),
        "time": appt.get("time", ""),
        "provider_name": appt.get("provider_name"),
        "provider_type": appt.get("provider_type"),
        "location": appt.get("location"),
        "notes": appt.get("notes"),
        "status": appt.get("status", "scheduled"),
        "reminder_sent": appt.get("reminder_sent", False),
        "created_at": appt.get("created_at", ""),
        "updated_at": appt.get("updated_at", ""),
    }
