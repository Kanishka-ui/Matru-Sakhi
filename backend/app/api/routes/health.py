"""
MatruSakhi Health API Routes
Endpoints for health records, milestones, and dashboard summary.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.api.middleware.auth_middleware import get_current_user
from app.schemas.health import (
    HealthRecordCreateRequest,
    HealthRecordResponse,
    HealthRecordListResponse,
    MilestoneResponse,
    MilestoneToggleRequest,
    HealthSummaryResponse,
)
from app.services import health_service

router = APIRouter(prefix="/api/health", tags=["Health"])


from pydantic import BaseModel
from typing import List

class DailyLogRequest(BaseModel):
    text: str

class DailyLogResponse(BaseModel):
    inferred_mood: str
    extracted_symptoms: List[str]
    advice: str

from app.services import partner_service
@router.post("/daily-log", response_model=DailyLogResponse)
async def process_daily_log(request: DailyLogRequest, current_user: dict = Depends(get_current_user)):
    # Forwards request.text to matrusakhi-ai-backend port 8001
    import httpx
    async with httpx.AsyncClient() as client:
        try:
            ai_response = await client.post("http://127.0.0.1:8001/analyze-text", json={"text": request.text}, timeout=10.0)
            data = ai_response.json()
            inferred_mood = "tired" if "tired" in request.text.lower() else "okay"
            extracted_symptoms = data.get("data", {}).get("symptoms", [])
            advice = data.get("advice", "Drink some water and rest. Sakhi is here!")
            
            # Fire the async Partner Support Nudge logic
            # This checks if she's tired and texts her partner passively
            import asyncio
            asyncio.create_task(
                partner_service.trigger_partner_nudge_engine(
                    mother_id=str(current_user["id"]), 
                    current_mood=inferred_mood, 
                    current_ai_risk="Low"
                )
            )

            return DailyLogResponse(
                inferred_mood=inferred_mood,
                extracted_symptoms=extracted_symptoms,
                advice=advice
            )
        except Exception as e:
            return DailyLogResponse(
                inferred_mood="okay",
                extracted_symptoms=[],
                advice="Take it easy today. Take deep breaths."
            )

# ─── Health Records ──────────────────────────────────────────

@router.post(
    "/records",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create health record",
    description="Log a new health record (vitals, symptoms, diet, mood, approx. kick count, etc.).",
)
async def create_record(
    request: HealthRecordCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new health record."""
    try:
        return await health_service.create_health_record(
            user_id=current_user["id"],
            record_type=request.record_type,
            data=request.data,
            notes=request.notes,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/records",
    response_model=HealthRecordListResponse,
    summary="List health records",
    description="Get paginated health records with optional type filter.",
)
async def list_records(
    record_type: Optional[str] = Query(None, description="Filter by record type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List health records."""
    return await health_service.get_health_records(
        user_id=current_user["id"],
        record_type=record_type,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/records/{record_id}",
    response_model=HealthRecordResponse,
    summary="Get health record",
    description="Get a specific health record by ID.",
)
async def get_record(
    record_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single health record."""
    record = await health_service.get_health_record_by_id(
        user_id=current_user["id"], record_id=record_id
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.delete(
    "/records/{record_id}",
    summary="Delete health record",
)
async def delete_record(
    record_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a health record."""
    deleted = await health_service.delete_health_record(
        user_id=current_user["id"], record_id=record_id
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return {"message": "Record deleted successfully"}


# ─── Milestones ──────────────────────────────────────────────

@router.get(
    "/milestones",
    response_model=list[MilestoneResponse],
    summary="Get milestones",
    description="Get pregnancy milestones auto-synced with current pregnancy progress.",
)
async def get_milestones(
    current_user: dict = Depends(get_current_user),
):
    """Get all milestones for the user, auto-completed based on pregnancy progress."""
    from app.models.user import compute_pregnancy_progress
    
    # Calculate current pregnancy week
    profile = current_user.get("profile", {})
    created_at = current_user.get("created_at")
    progress = compute_pregnancy_progress(profile, created_at)
    current_week = progress.get("pregnancy_week")
    
    # Initialize milestones if needed and auto-sync with progress
    await health_service.initialize_milestones(user_id=current_user["id"])
    
    if current_week:
        # Auto-complete milestones for weeks that have passed
        await health_service.sync_milestones_with_pregnancy_progress(
            user_id=current_user["id"],
            current_week=current_week
        )
    
    return await health_service.get_milestones(user_id=current_user["id"])


@router.patch(
    "/milestones/{milestone_id}",
    response_model=MilestoneResponse,
    summary="Toggle milestone",
    description="Mark a milestone as completed or incomplete.",
)
async def toggle_milestone(
    milestone_id: str,
    request: MilestoneToggleRequest,
    current_user: dict = Depends(get_current_user),
):
    """Toggle milestone completion."""
    result = await health_service.toggle_milestone(
        user_id=current_user["id"],
        milestone_id=milestone_id,
        is_completed=request.is_completed,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return result


# ─── Dashboard Summary ──────────────────────────────────────

@router.get(
    "/summary",
    response_model=HealthSummaryResponse,
    summary="Health dashboard summary",
    description="Get a comprehensive health summary for the dashboard.",
)
async def get_summary(
    current_user: dict = Depends(get_current_user),
):
    """Get health dashboard summary."""
    profile = current_user.get("profile", {})
    pregnancy_week = profile.get("pregnancy_week")
    created_at = current_user.get("created_at")
    return await health_service.get_health_summary(
        user_id=current_user["id"],
        user_profile=profile,
        pregnancy_week=pregnancy_week,
        created_at=created_at,
    )
