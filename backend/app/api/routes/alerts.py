"""
MatruSakhi Alert API Routes
Endpoints for alerts, notifications, and danger sign checking.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.middleware.auth_middleware import get_current_user
from app.schemas.alert import (
    AlertResponse,
    AlertListResponse,
    AlertMarkReadRequest,
    DangerSignCheckRequest,
    DangerSignCheckResponse,
)
from app.services import alert_service

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get(
    "/",
    response_model=AlertListResponse,
    summary="List alerts",
    description="Get all alerts/notifications for the current user.",
)
async def list_alerts(
    include_dismissed: bool = Query(False, description="Include dismissed alerts"),
    current_user: dict = Depends(get_current_user),
):
    """List all alerts."""
    return await alert_service.get_alerts(
        user_id=current_user["id"],
        include_dismissed=include_dismissed,
    )


@router.post(
    "/mark-read",
    summary="Mark alerts as read",
    description="Mark one or more alerts as read.",
)
async def mark_alerts_read(
    request: AlertMarkReadRequest,
    current_user: dict = Depends(get_current_user),
):
    """Mark alerts as read."""
    count = await alert_service.mark_alerts_read(
        user_id=current_user["id"],
        alert_ids=request.alert_ids,
    )
    return {"message": f"{count} alert(s) marked as read"}


@router.delete(
    "/{alert_id}",
    summary="Dismiss alert",
    description="Dismiss (hide) an alert.",
)
async def dismiss_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Dismiss an alert."""
    dismissed = await alert_service.dismiss_alert(
        user_id=current_user["id"], alert_id=alert_id
    )
    if not dismissed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return {"message": "Alert dismissed"}


@router.post(
    "/check-danger-signs",
    response_model=DangerSignCheckResponse,
    summary="Check danger signs",
    description="Analyze symptoms for potential danger signs. Creates an alert if danger is detected.",
)
async def check_danger_signs(
    request: DangerSignCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """Check symptoms for danger signs."""
    try:
        return await alert_service.check_danger_signs(
            user_id=current_user["id"],
            symptoms=request.symptoms,
            pregnancy_week=request.pregnancy_week,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
