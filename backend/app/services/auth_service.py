"""
MatruSakhi Auth Service
Business logic for user authentication and registration.
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.db.database import get_collection
from app.models.user import create_user_document, user_response_serializer, calculate_pregnancy_start_date
from app.schemas.user import UserRegisterRequest, UserLoginRequest
from app.services.email_service import (
    send_verification_email,
    create_verification_token,
    decode_verification_token,
)


USERS_COLLECTION = "users"


async def register_user(data: UserRegisterRequest) -> dict:
    """
    Register a new user.
    Returns: dict with tokens and user data, or raises ValueError.
    """
    users = get_collection(USERS_COLLECTION)

    # Check if passwords match
    if data.password != data.confirm_password:
        raise ValueError("Passwords do not match")

    # Check if email already exists
    existing_user = await users.find_one({"email": data.email.lower().strip()})
    if existing_user:
        raise ValueError("An account with this email already exists")

    # Check if phone already exists (if provided)
    if data.phone:
        existing_phone = await users.find_one({"phone": data.phone})
        if existing_phone:
            raise ValueError("An account with this phone number already exists")

    # Hash password and create user document
    hashed = hash_password(data.password)
    user_doc = create_user_document(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hashed,
        phone=data.phone,
        role=data.role.value,
        pregnancy_week=data.pregnancy_week,
        due_date=data.due_date,
        blood_group=data.blood_group.value if data.blood_group else None,
        age=data.age,
        emergency_contact=data.emergency_contact,
    )

    # Insert into database
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Calculate and store pregnancy_start_date from the entered pregnancy_week
    if data.pregnancy_week:
        start_date = calculate_pregnancy_start_date(data.pregnancy_week)
        await users.update_one(
            {"_id": result.inserted_id},
            {"$set": {"profile.pregnancy_start_date": start_date}}
        )
        user_doc["profile"]["pregnancy_start_date"] = start_date

    # Send verification email (non-blocking — don't fail registration if email fails)
    try:
        await send_verification_email(
            email=data.email,
            user_name=data.full_name,
            user_id=str(result.inserted_id),
        )
    except Exception as e:
        print(f"[AUTH] Verification email failed: {e}")

    # Create tokens
    token_data = {"sub": str(result.inserted_id), "email": data.email, "role": data.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Create indexes for better query performance
    await users.create_index("email", unique=True)
    await users.create_index("phone", sparse=True)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user_response_serializer(user_doc),
    }


async def login_user(data: UserLoginRequest) -> dict:
    """
    Authenticate a user and return tokens.
    Returns: dict with tokens and user data, or raises ValueError.
    """
    users = get_collection(USERS_COLLECTION)

    # Find user by email
    user = await users.find_one({"email": data.email.lower().strip()})
    if not user:
        raise ValueError("Invalid email or password")

    # Verify password
    if not verify_password(data.password, user["hashed_password"]):
        raise ValueError("Invalid email or password")

    # Check if account is active
    if not user.get("is_active", True):
        raise ValueError("Your account has been deactivated. Please contact support.")

    # Update last login
    await users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    # Create tokens
    token_data = {"sub": str(user["_id"]), "email": user["email"], "role": user.get("role", "mother")}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user["last_login"] = datetime.now(timezone.utc)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user_response_serializer(user),
    }


async def refresh_user_token(refresh_token: str) -> dict:
    """
    Refresh an expired access token using a valid refresh token.
    """
    payload = decode_token(refresh_token)
    if not payload:
        raise ValueError("Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise ValueError("Invalid token type")

    users = get_collection(USERS_COLLECTION)
    user = await users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise ValueError("User not found")

    if not user.get("is_active", True):
        raise ValueError("Account is deactivated")

    # Create new tokens
    token_data = {"sub": str(user["_id"]), "email": user["email"], "role": user.get("role", "mother")}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user_response_serializer(user),
    }


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Fetch a user by their ObjectId string."""
    users = get_collection(USERS_COLLECTION)
    try:
        user = await users.find_one({"_id": ObjectId(user_id)})
        if user:
            return user_response_serializer(user)
        return None
    except Exception:
        return None


async def update_user_profile(user_id: str, update_data: dict) -> Optional[dict]:
    """Update user profile fields."""
    users = get_collection(USERS_COLLECTION)

    # Build update document
    update_fields = {"updated_at": datetime.now(timezone.utc)}

    # Top-level fields
    for field in ["full_name", "phone"]:
        if field in update_data and update_data[field] is not None:
            update_fields[field] = update_data[field]

    # Profile nested fields
    profile_fields = ["age", "date_of_birth", "pregnancy_week", "due_date", "blood_group", "emergency_contact", "emergency_contacts", "preferred_language"]
    for field in profile_fields:
        if field in update_data and update_data[field] is not None:
            if field == "emergency_contacts":
                update_fields[f"profile.{field}"] = [c.dict() if hasattr(c, "dict") else c for c in update_data[field]]
            else:
                update_fields[f"profile.{field}"] = update_data[field]

    # If pregnancy_week changed, recalculate pregnancy_start_date
    if "pregnancy_week" in update_data and update_data["pregnancy_week"] is not None:
        start_date = calculate_pregnancy_start_date(update_data["pregnancy_week"])
        update_fields["profile.pregnancy_start_date"] = start_date

    result = await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )

    if result.modified_count == 0 and result.matched_count == 0:
        return None

    # Fetch updated user
    return await get_user_by_id(user_id)


async def change_user_password(user_id: str, current_password: str, new_password: str) -> bool:
    """Change user password after verifying current password."""
    users = get_collection(USERS_COLLECTION)
    user = await users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise ValueError("User not found")

    if not verify_password(current_password, user["hashed_password"]):
        raise ValueError("Current password is incorrect")

    new_hashed = hash_password(new_password)
    await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": new_hashed, "updated_at": datetime.now(timezone.utc)}}
    )
    return True


async def verify_email(token: str) -> dict:
    """
    Verify a user's email using the verification token.
    Returns a dict with success status and message.
    """
    payload = decode_verification_token(token)
    if not payload:
        raise ValueError("Invalid or expired verification link")

    user_id = payload.get("sub")
    email = payload.get("email")

    users = get_collection(USERS_COLLECTION)
    user = await users.find_one({"_id": ObjectId(user_id), "email": email})

    if not user:
        raise ValueError("User not found")

    if user.get("is_verified", False):
        return {"message": "Email is already verified", "already_verified": True}

    await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"message": "Email verified successfully!", "already_verified": False}


async def resend_verification_email(email: str) -> dict:
    """
    Resend the verification email to a user.
    """
    users = get_collection(USERS_COLLECTION)
    user = await users.find_one({"email": email.lower().strip()})

    if not user:
        # Don't reveal if email exists or not
        return {"message": "If this email is registered, a verification link has been sent."}

    if user.get("is_verified", False):
        return {"message": "This email is already verified."}

    try:
        await send_verification_email(
            email=user["email"],
            user_name=user["full_name"],
            user_id=str(user["_id"]),
        )
    except Exception as e:
        print(f"[AUTH] Resend verification email failed: {e}")

    return {"message": "If this email is registered, a verification link has been sent."}
