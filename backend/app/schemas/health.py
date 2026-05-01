"""
MatruSakhi Health Schemas
Pydantic models for health records and milestones.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class RecordType(str, Enum):
    VITALS = "vitals"
    CHECKUP = "checkup"
    LAB_RESULT = "lab_result"
    SYMPTOM = "symptom"
    MEDICATION = "medication"
    DIET = "diet"
    EXERCISE = "exercise"
    MOOD = "mood"
    KICK_COUNT = "kick_count"


# ─── Vitals Data Schemas ─────────────────────────────────────

class VitalsData(BaseModel):
    """Blood pressure, weight, etc."""
    systolic_bp: Optional[int] = Field(None, ge=60, le=250, description="Systolic blood pressure")
    diastolic_bp: Optional[int] = Field(None, ge=40, le=150, description="Diastolic blood pressure")
    weight_kg: Optional[float] = Field(None, ge=20, le=200, description="Weight in kg")
    temperature_c: Optional[float] = Field(None, ge=34, le=42, description="Temperature in °C")
    heart_rate: Optional[int] = Field(None, ge=40, le=200, description="Heart rate bpm")
    blood_sugar: Optional[float] = Field(None, description="Blood sugar mg/dL")
    hemoglobin: Optional[float] = Field(None, description="Hemoglobin g/dL")


class SymptomData(BaseModel):
    """Symptom logging."""
    symptoms: list[str] = Field(..., description="List of symptoms")
    severity: str = Field("mild", description="mild, moderate, severe")
    duration: Optional[str] = Field(None, description="How long symptoms lasted")


class DietData(BaseModel):
    """Diet/nutrition log."""
    meals: list[dict] = Field(default=[], description="List of meals with items")
    water_glasses: Optional[int] = Field(None, ge=0, le=20, description="Glasses of water")
    supplements_taken: list[str] = Field(default=[], description="Supplements taken")
    total_calories: Optional[int] = Field(None, description="Estimated total calories")


class MoodData(BaseModel):
    """Mood/mental health log."""
    mood: str = Field(..., description="happy, calm, anxious, sad, stressed, tired, energetic")
    energy_level: Optional[int] = Field(None, ge=1, le=10, description="Energy 1-10")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24, description="Hours of sleep")
    notes: Optional[str] = None


class KickCountData(BaseModel):
    """Fetal kick counting."""
    count: int = Field(..., ge=0, description="Approximate number of kicks")
    duration_minutes: int = Field(..., ge=1, description="Duration in minutes")
    start_time: Optional[str] = Field(None, description="When counting started")


# ─── Health Record CRUD ──────────────────────────────────────

class HealthRecordCreateRequest(BaseModel):
    """Create a new health record."""
    record_type: RecordType
    data: dict = Field(..., description="Record data (structure depends on record_type)")
    notes: Optional[str] = Field(None, max_length=1000)


class HealthRecordResponse(BaseModel):
    """Health record response."""
    id: str
    user_id: str
    record_type: str
    data: dict
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class HealthRecordListResponse(BaseModel):
    """Paginated health record list."""
    records: list[HealthRecordResponse]
    total: int
    page: int
    page_size: int


# ─── Milestones ───────────────────────────────────────────────

class MilestoneResponse(BaseModel):
    """Pregnancy milestone response."""
    id: str
    user_id: str
    week: int
    title: str
    description: str
    category: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class MilestoneToggleRequest(BaseModel):
    """Toggle milestone completion."""
    is_completed: bool


# ─── Dashboard Summary ──────────────────────────────────────

class HealthSummaryResponse(BaseModel):
    """Health dashboard summary."""
    current_week: Optional[int] = None
    current_day: Optional[int] = None
    pregnancy_display: Optional[str] = None
    trimester: Optional[str] = None
    days_remaining: Optional[int] = None
    latest_vitals: Optional[dict] = None
    latest_mood: Optional[str] = None
    kick_count_today: Optional[int] = None
    upcoming_milestones: list[MilestoneResponse] = []
    recent_symptoms: list[str] = []
    total_records: int = 0
