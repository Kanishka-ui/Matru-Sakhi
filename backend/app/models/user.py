"""
MatruSakhi User Model
MongoDB user document structure and helper functions.
"""

from datetime import datetime, timezone, timedelta, date
from typing import Optional


def create_user_document(
    full_name: str,
    email: str,
    hashed_password: str,
    phone: Optional[str] = None,
    role: str = "mother",
    pregnancy_week: Optional[int] = None,
    due_date: Optional[str] = None,
    blood_group: Optional[str] = None,
    age: Optional[int] = None,
    emergency_contact: Optional[str] = None,
) -> dict:
    """
    Create a user document for MongoDB insertion.

    Roles:
    - mother: Expectant or new mother (primary user)
    - asha: ASHA (community health worker)
    - anm: ANM (Auxiliary Nurse Midwife)
    - doctor: Doctor/specialist
    - admin: System administrator
    - partner: Partner or Caregiver (Read-Only access to mother's stats)
    """
    now = datetime.now(timezone.utc)
    return {
        "full_name": full_name,
        "email": email.lower().strip(),
        "hashed_password": hashed_password,
        "phone": phone,
        "role": role,
        "is_active": True,
        "is_verified": False,
        "profile": {
            "pregnancy_week": pregnancy_week,
            "pregnancy_start_date": None,  # LMP date — set dynamically
            "due_date": due_date,
            "blood_group": blood_group,
            "age": age,
            "date_of_birth": None,
            "emergency_contact": emergency_contact,
            "emergency_contacts": [],
            "avatar_url": None,
            "preferred_language": "en",
            "linked_mother_id": None,
            "linked_partner_id": None,
        },
        "health_data": {
            "conditions": [],
            "allergies": [],
            "medications": [],
            "last_checkup": None,
        },
        "notifications": {
            "email_enabled": True,
            "sms_enabled": False,
            "push_enabled": True,
        },
        "created_at": now,
        "updated_at": now,
        "last_login": None,
    }


def compute_pregnancy_progress(profile: dict, created_at: Optional[datetime] = None) -> dict:
    """
    Dynamically compute current pregnancy week + day from pregnancy_start_date.
    Returns a dict with: pregnancy_week, pregnancy_day, pregnancy_display,
    trimester, days_remaining, total_days_pregnant.
    """
    start_date = profile.get("pregnancy_start_date")
    edd_date_str = profile.get("due_date")
    
    # 1. Determine Base Date (LMP / Day 0)
    if not start_date and profile.get("pregnancy_week") is not None:
        pw = profile.get("pregnancy_week")
        pd = profile.get("pregnancy_day", 0)  # defaulting day to 0 if not set
        if created_at:
            # Anchor the start date to when the account was created
            base_date = created_at.date() if isinstance(created_at, datetime) else date.today()
            start_date = base_date - timedelta(days=(pw * 7) + pd)
        else:
            # Anchor the start date to today if no better info exists
            start_date = date.today() - timedelta(days=(pw * 7) + pd)

    if not start_date:
        return {
            "pregnancy_week": None,
            "pregnancy_day": None,
            "pregnancy_display": None,
            "trimester": None,
            "days_remaining": None,
            "total_days_pregnant": None,
        }

    # Convert start_date to date object if it's a string
    if isinstance(start_date, (str, bytes)):
        try:
            start_date = datetime.fromisoformat(str(start_date)).date()
        except (ValueError, TypeError):
            try:
                start_date = datetime.strptime(str(start_date), "%Y-%m-%d").date()
            except Exception:
                start_date = date.today()
    elif isinstance(start_date, datetime):
        start_date = start_date.date()

    today = date.today()
    # 2. Calculate Current Gestational Age
    total_days = (today - start_date).days
    total_days = max(0, total_days)  # Safety: can't be negative

    weeks = total_days // 7
    days = total_days % 7
    
    # 3. Determine Trimester strictly based on days
    if total_days <= 97:
        trimester = "1st"
    elif total_days <= 195:
        trimester = "2nd"
    else:
        trimester = "3rd"

    # 4. Calculate Days Remaining (Prioritize EDD over default 280 days)
    days_remaining = None
    if edd_date_str:
        try:
            if isinstance(edd_date_str, datetime):
                edd_date = edd_date_str.date()
            else:
                edd_date = datetime.fromisoformat(str(edd_date_str)).date()
            
            diff = (edd_date - today).days
            if diff < 0:
                days_remaining = f"Past Due by {abs(diff)} days"
            else:
                days_remaining = diff
        except Exception:
            pass

    # Fallback if EDD is missing or failed to parse
    if days_remaining is None:
        diff = 280 - total_days
        if diff < 0:
            days_remaining = f"Past Due by {abs(diff)} days"
        else:
            days_remaining = diff

    return {
        "pregnancy_week": weeks,
        "pregnancy_day": days,
        "pregnancy_display": f"{weeks} weeks {days} days",
        "trimester": trimester,
        "days_remaining": days_remaining,
        "total_days_pregnant": total_days,
    }


def calculate_pregnancy_start_date(pregnancy_week: int) -> str:
    """
    Calculate the LMP (pregnancy start) date from the current pregnancy week.
    If user says 'I am 4 weeks pregnant today', LMP = today - 28 days.
    Returns ISO format date string.
    """
    today = date.today()
    lmp_date = today - timedelta(days=pregnancy_week * 7)
    return lmp_date.isoformat()


def user_response_serializer(user: dict) -> dict:
    """Serialize a MongoDB user document for API response (exclude sensitive fields)."""
    profile = user.get("profile", {})
    created_at = user.get("created_at")

    # Compute dynamic pregnancy progress
    progress = compute_pregnancy_progress(profile, created_at)

    # Merge computed fields into the profile
    enriched_profile = {**profile}
    enriched_profile["pregnancy_week"] = progress["pregnancy_week"]
    enriched_profile["pregnancy_day"] = progress["pregnancy_day"]
    enriched_profile["pregnancy_display"] = progress["pregnancy_display"]
    enriched_profile["trimester"] = progress["trimester"]
    enriched_profile["days_remaining"] = progress["days_remaining"]
    enriched_profile["total_days_pregnant"] = progress["total_days_pregnant"]

    return {
        "id": str(user["_id"]),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone"),
        "role": user.get("role", "mother"),
        "is_active": user.get("is_active", True),
        "is_verified": user.get("is_verified", False),
        "profile": enriched_profile,
        "health_data": user.get("health_data", {}),
        "notifications": user.get("notifications", {}),
        "created_at": created_at,
        "last_login": user.get("last_login"),
        "linked_mother_id": user.get("profile", {}).get("linked_mother_id"),
        "linked_partner_id": user.get("profile", {}).get("linked_partner_id"),
    }
