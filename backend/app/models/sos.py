"""
MatruSakhi SOS Model
MongoDB document structure for SOS alerts with severity levels.
"""

from datetime import datetime, timezone
from typing import Optional


SEVERITY_LEVELS = {
    1: {
        "name": "Need Help",
        "color": "yellow",
        "description": "I need some help, please check on me",
        "sms_template": (
            "MatruSakhi: {user_name} needs help. "
            "Location: {location_url} "
            "Time: {time}"
        ),
    },
    2: {
        "name": "Urgent",
        "color": "orange",
        "description": "I need urgent help, please come quickly",
        "sms_template": (
            "MatruSakhi URGENT: {user_name} needs urgent help. "
            "Location: {location_url} "
            "Time: {time}"
        ),
    },
    3: {
        "name": "Emergency",
        "color": "red",
        "description": "Medical emergency - please call ambulance and come immediately",
        "sms_template": (
            "MatruSakhi EMERGENCY: {user_name} needs immediate help. "
            "Call 108. Location: {location_url} "
            "Time: {time}"
        ),
        "voice_message": (
            "Emergency alert from MatruSakhi. "
            "{user_name} has triggered a medical emergency. "
            "Please call an ambulance by dialing 108 and reach her immediately. "
            "Her GPS location has been sent to your phone via SMS."
        ),
    },
}


def create_sos_document(
    user_id: str,
    severity: int,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    address: Optional[str] = None,
    message: Optional[str] = None,
    notified_contacts: list = None,
) -> dict:
    """Create an SOS alert document for MongoDB insertion."""
    now = datetime.now(timezone.utc)
    level_info = SEVERITY_LEVELS.get(severity, SEVERITY_LEVELS[1])

    return {
        "user_id": user_id,
        "severity": severity,
        "severity_name": level_info["name"],
        "severity_color": level_info["color"],
        "latitude": latitude,
        "longitude": longitude,
        "address": address,
        "message": message or level_info["description"],
        "location_url": f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}" if latitude and longitude else None,
        "notified_contacts": notified_contacts or [],
        "voice_call_made": False,
        "status": "active",  # active | resolved | cancelled
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    }


def sos_serializer(sos: dict) -> dict:
    """Serialize an SOS document for API response."""
    return {
        "id": str(sos["_id"]),
        "user_id": sos.get("user_id", ""),
        "severity": sos.get("severity", 1),
        "severity_name": sos.get("severity_name", ""),
        "severity_color": sos.get("severity_color", ""),
        "latitude": sos.get("latitude"),
        "longitude": sos.get("longitude"),
        "address": sos.get("address"),
        "message": sos.get("message", ""),
        "location_url": sos.get("location_url"),
        "notified_contacts": sos.get("notified_contacts", []),
        "voice_call_made": sos.get("voice_call_made", False),
        "status": sos.get("status", "active"),
        "resolved_at": sos.get("resolved_at"),
        "created_at": sos.get("created_at", ""),
    }
