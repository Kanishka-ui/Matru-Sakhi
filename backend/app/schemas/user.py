"""
MatruSakhi User Schemas
Pydantic models for request validation and response serialization.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    MOTHER = "mother"
    ASHA = "asha"
    ANM = "anm"
    DOCTOR = "doctor"
    ADMIN = "admin"


class BloodGroup(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


# ─── Registration ───────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    """Schema for user registration."""
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars)")
    confirm_password: str = Field(..., description="Confirm password")
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{6,14}$", description="Phone number")
    role: UserRole = Field(default=UserRole.MOTHER, description="User role")
    age: Optional[int] = Field(None, ge=14, le=60, description="Age")
    pregnancy_week: Optional[int] = Field(None, ge=1, le=42, description="Current pregnancy week")
    due_date: Optional[str] = Field(None, description="Expected due date (YYYY-MM-DD)")
    blood_group: Optional[BloodGroup] = Field(None, description="Blood group")
    emergency_contact: Optional[str] = Field(None, description="Emergency contact number")


# ─── Login ──────────────────────────────────────────────────

class UserLoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")


# ─── Token Response ─────────────────────────────────────────

class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh."""
    refresh_token: str


# ─── User Profile ───────────────────────────────────────────

class EmergencyContact(BaseModel):
    """Schema for a single emergency contact."""
    name: str = Field(..., description="Contact name")
    phone: str = Field(..., description="Contact phone number")
    relation: str = Field(..., description="Relation to the user (e.g., Husband, Mother, Friend)")

class UserProfile(BaseModel):
    """Nested profile data."""
    pregnancy_week: Optional[int] = None
    pregnancy_day: Optional[int] = None
    pregnancy_display: Optional[str] = None
    pregnancy_start_date: Optional[str] = None
    trimester: Optional[str] = None
    days_remaining: Optional[int] = None
    total_days_pregnant: Optional[int] = None
    due_date: Optional[str] = None
    blood_group: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    emergency_contacts: list[EmergencyContact] = Field(default=[], description="List of emergency contacts")
    emergency_contact: Optional[str] = None # Legacy support
    emergency_contact_name: Optional[str] = None # Legacy support
    emergency_contact_phone: Optional[str] = None # Legacy support
    avatar_url: Optional[str] = None
    preferred_language: str = "en"


class HealthData(BaseModel):
    """Nested health data."""
    conditions: list[str] = []
    allergies: list[str] = []
    medications: list[str] = []
    last_checkup: Optional[str] = None


class NotificationPrefs(BaseModel):
    """Notification preferences."""
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True


class UserResponse(BaseModel):
    """Schema for user response (public-facing)."""
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    profile: Optional[UserProfile] = None
    health_data: Optional[HealthData] = None
    notifications: Optional[NotificationPrefs] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


# ─── Profile Update ─────────────────────────────────────────

class UserProfileUpdateRequest(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{6,14}$")
    age: Optional[int] = Field(None, ge=14, le=60)
    pregnancy_week: Optional[int] = Field(None, ge=1, le=42)
    due_date: Optional[str] = None
    blood_group: Optional[BloodGroup] = None
    emergency_contacts: Optional[list[EmergencyContact]] = None
    emergency_contact: Optional[str] = None
    preferred_language: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    """Schema for changing password."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    confirm_new_password: str = Field(..., description="Confirm new password")


# ─── Message Response ───────────────────────────────────────

class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    success: bool = True
