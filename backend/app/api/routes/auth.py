"""
MatruSakhi Auth Routes
API endpoints for authentication: register, login, refresh, profile, password change.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    UserProfileUpdateRequest,
    PasswordChangeRequest,
    MessageResponse,
)
from app.services.auth_service import (
    register_user,
    login_user,
    refresh_user_token,
    update_user_profile,
    change_user_password,
    verify_email,
    resend_verification_email,
)
from app.api.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ─── Register ───────────────────────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new MatruSakhi account. Returns JWT tokens on success.",
)
async def register(data: UserRegisterRequest):
    """Register a new user account."""
    try:
        result = await register_user(data)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


# ─── Login ──────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login to an existing account",
    description="Authenticate with email and password. Returns JWT tokens on success.",
)
async def login(data: UserLoginRequest):
    """Login with email and password."""
    try:
        result = await login_user(data)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
        )


# ─── Email Verification ────────────────────────────────────

@router.get(
    "/verify-email",
    summary="Verify email address",
    description="Verify a user's email using the token from the verification link.",
)
async def verify_email_route(token: str):
    """Verify email using the token."""
    try:
        result = await verify_email(token)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/resend-verification",
    summary="Resend verification email",
    description="Resend verification email to the specified email address.",
)
async def resend_verification(data: dict):
    """Resend the verification email."""
    email = data.get("email", "")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required",
        )
    result = await resend_verification_email(email)
    return result


@router.get(
    "/verification-status",
    summary="Check verification status",
    description="Check if the current user's email is verified.",
)
async def verification_status(current_user: dict = Depends(get_current_user)):
    """Check if current user's email is verified."""
    return {
        "is_verified": current_user.get("is_verified", False),
        "email": current_user.get("email", ""),
    }


# ─── Refresh Token ──────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get a new access token using a valid refresh token.",
)
async def refresh_token(data: RefreshTokenRequest):
    """Refresh an expired access token."""
    try:
        result = await refresh_user_token(data.refresh_token)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


# ─── Get Current User (Protected) ───────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the authenticated user's profile. Requires a valid access token.",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user


# ─── Update Profile (Protected) ─────────────────────────────

@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update user profile",
    description="Update the authenticated user's profile information.",
)
async def update_profile(
    data: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's profile."""
    try:
        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        updated_user = await update_user_profile(current_user["id"], update_dict)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}",
        )


# ─── Change Password (Protected) ────────────────────────────

@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change the current user's password. Requires current password.",
)
async def change_password(
    data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Change the current user's password."""
    if data.new_password != data.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match",
        )

    try:
        await change_user_password(
            current_user["id"],
            data.current_password,
            data.new_password,
        )
        return MessageResponse(message="Password changed successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
