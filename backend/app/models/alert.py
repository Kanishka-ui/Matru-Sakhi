"""
MatruSakhi Alert Model
MongoDB document structure for health alerts and notifications.
"""

from datetime import datetime, timezone
from typing import Optional


def create_alert_document(
    user_id: str,
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    source: str = "system",
    action_required: Optional[str] = None,
    related_record_id: Optional[str] = None,
) -> dict:
    """
    Create an alert/notification document.

    alert_type options:
    - danger_sign: critical health warning
    - reminder: appointment/medication reminder
    - milestone: pregnancy milestone reached
    - tip: health tip or recommendation
    - system: system notification

    severity options:
    - critical: immediate action needed (red)
    - warning: attention needed (orange)
    - info: informational (blue)
    - success: positive update (green)
    """
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "alert_type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
        "source": source,
        "action_required": action_required,
        "related_record_id": related_record_id,
        "is_read": False,
        "is_dismissed": False,
        "created_at": now,
    }


def alert_serializer(alert: dict) -> dict:
    """Serialize an alert for API response."""
    return {
        "id": str(alert["_id"]),
        "user_id": alert.get("user_id", ""),
        "alert_type": alert.get("alert_type", ""),
        "severity": alert.get("severity", "info"),
        "title": alert.get("title", ""),
        "message": alert.get("message", ""),
        "source": alert.get("source", "system"),
        "action_required": alert.get("action_required"),
        "related_record_id": alert.get("related_record_id"),
        "is_read": alert.get("is_read", False),
        "is_dismissed": alert.get("is_dismissed", False),
        "created_at": alert.get("created_at", ""),
    }
