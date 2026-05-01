"""
MatruSakhi Alert Schemas
Pydantic models for alerts and notifications.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    DANGER_SIGN = "danger_sign"
    REMINDER = "reminder"
    MILESTONE = "milestone"
    TIP = "tip"
    SYSTEM = "system"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"


class AlertResponse(BaseModel):
    """Alert response."""
    id: str
    user_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    source: str = "system"
    action_required: Optional[str] = None
    related_record_id: Optional[str] = None
    is_read: bool = False
    is_dismissed: bool = False
    created_at: Optional[datetime] = None


class AlertListResponse(BaseModel):
    """List of alerts."""
    alerts: list[AlertResponse]
    total: int
    unread_count: int


class AlertMarkReadRequest(BaseModel):
    """Mark alerts as read."""
    alert_ids: list[str] = Field(..., description="List of alert IDs to mark as read")


class DangerSignCheckRequest(BaseModel):
    """Request to check symptoms for danger signs."""
    symptoms: list[str] = Field(..., min_length=1, description="List of symptoms to check")
    pregnancy_week: Optional[int] = Field(None, ge=1, le=42)


class DangerSignCheckResponse(BaseModel):
    """Response from danger sign assessment."""
    is_danger: bool
    severity: str
    message: str
    recommendations: list[str] = []
    seek_immediate_care: bool = False
