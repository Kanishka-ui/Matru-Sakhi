"""
MatruSakhi Appointment API Routes
Endpoints for appointment scheduling and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime, date

from app.api.middleware.auth_middleware import get_current_user
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentResponse,
    AppointmentListResponse,
)
from app.services import appointment_service

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.post(
    "/",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create appointment",
    description="Schedule a new appointment.",
)
async def create_appointment(
    request: AppointmentCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new appointment."""
    try:
        data = request.model_dump()
        
        # Validate date is not in the past
        if data.get("scheduled_date"):
            date_str = data["scheduled_date"].split("T")[0] if "T" in data["scheduled_date"] else data["scheduled_date"]
            try:
                appt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                today = date.today()
                if appt_date < today:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot schedule appointments for past dates"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format"
                )

        # Normalize: if scheduled_date is provided, extract date and time
        if data.get("scheduled_date") and not data.get("date"):
            if "T" in data["scheduled_date"]:
                parts = data["scheduled_date"].split("T")
                data["date"] = parts[0]
                data["time"] = parts[1][:5] if len(parts) > 1 else "09:00"
            else:
                data["date"] = data["scheduled_date"]
                data["time"] = "09:00"

        # Fallback defaults
        if not data.get("date"):
            data["date"] = ""
        if not data.get("time"):
            data["time"] = "09:00"

        # Map frontend field names to model field names
        if data.get("doctor_name") and not data.get("provider_name"):
            data["provider_name"] = data["doctor_name"]
        if data.get("hospital_name") and not data.get("location"):
            data["location"] = data["hospital_name"]

        return await appointment_service.create_appointment(
            user_id=current_user["id"],
            data=data,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/",
    response_model=AppointmentListResponse,
    summary="List appointments",
    description="Get all appointments. Use upcoming=true for future scheduled appointments only.",
)
async def list_appointments(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    upcoming: bool = Query(False, description="Show only upcoming scheduled appointments"),
    current_user: dict = Depends(get_current_user),
):
    """List appointments."""
    return await appointment_service.get_appointments(
        user_id=current_user["id"],
        status=status_filter,
        upcoming_only=upcoming,
    )


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Get appointment",
)
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single appointment."""
    appt = await appointment_service.get_appointment_by_id(
        user_id=current_user["id"], appointment_id=appointment_id
    )
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appt


@router.put(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Update appointment",
)
async def update_appointment(
    appointment_id: str,
    request: AppointmentUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update an appointment."""
    update_data = request.model_dump(exclude_none=True)
    
    # Validate date is not in the past if being updated
    if update_data.get("scheduled_date"):
        date_str = update_data["scheduled_date"].split("T")[0] if "T" in update_data["scheduled_date"] else update_data["scheduled_date"]
        try:
            appt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            today = date.today()
            if appt_date < today:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot schedule appointments for past dates"
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format"
            )
    
    result = await appointment_service.update_appointment(
        user_id=current_user["id"],
        appointment_id=appointment_id,
        update_data=update_data,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return result


@router.delete(
    "/{appointment_id}",
    summary="Delete appointment",
)
async def delete_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete an appointment."""
    deleted = await appointment_service.delete_appointment(
        user_id=current_user["id"], appointment_id=appointment_id
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return {"message": "Appointment deleted successfully"}
