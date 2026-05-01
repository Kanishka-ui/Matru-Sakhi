"""
MatruSakhi Appointment Schemas
Pydantic models for appointment scheduling.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class AppointmentType(str, Enum):
    PRENATAL_CHECKUP = "prenatal_checkup"
    POSTNATAL_CHECKUP = "postnatal_checkup"
    CHECKUP = "checkup"
    ULTRASOUND = "ultrasound"
    LAB_TEST = "lab_test"
    BLOOD_TEST = "blood_test"
    VACCINATION = "vaccination"
    CONSULTATION = "consultation"
    SPECIALIST = "specialist"
    EMERGENCY = "emergency"
    OTHER = "other"


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"


class AppointmentCreateRequest(BaseModel):
    """Create a new appointment."""
    title: str = Field(..., min_length=2, max_length=200)
    appointment_type: AppointmentType = AppointmentType.OTHER
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    time: Optional[str] = Field(None, description="Time in HH:MM format")
    scheduled_date: Optional[str] = Field(None, description="Combined ISO datetime (alternative to date+time)")
    doctor_name: Optional[str] = Field(None, max_length=100)
    hospital_name: Optional[str] = Field(None, max_length=200)
    provider_name: Optional[str] = Field(None, max_length=100)
    provider_type: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=1000)


class AppointmentUpdateRequest(BaseModel):
    """Update an appointment."""
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    date: Optional[str] = None
    time: Optional[str] = None
    provider_name: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None


class AppointmentResponse(BaseModel):
    """Appointment response."""
    id: str
    user_id: str
    title: str
    appointment_type: str
    date: str
    time: str
    provider_name: Optional[str] = None
    provider_type: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: str = "scheduled"
    reminder_sent: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AppointmentListResponse(BaseModel):
    """List of appointments."""
    appointments: list[AppointmentResponse]
    total: int
