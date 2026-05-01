"""
MatruSakhi SOS API Routes
Endpoints for SOS alert triggering, resolution, and history.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.api.middleware.auth_middleware import get_current_user
from app.services import sos_service


router = APIRouter(prefix="/api/sos", tags=["SOS"])


class SOSTriggerRequest(BaseModel):
    severity: int  # 1, 2, or 3
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    message: Optional[str] = None
    location_url: Optional[str] = None  # Custom Google Maps URL


@router.post(
    "/trigger",
    summary="Trigger SOS alert",
    description="Send an SOS alert to emergency contacts. Severity: 1=Need Help, 2=Urgent, 3=Emergency (voice call).",
    status_code=status.HTTP_201_CREATED,
)
async def trigger_sos(
    data: SOSTriggerRequest,
    current_user: dict = Depends(get_current_user),
):
    """Trigger an SOS alert."""
    try:
        result = await sos_service.trigger_sos(
            user_id=current_user["id"],
            severity=data.severity,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
            message=data.message,
            location_url=data.location_url,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SOS trigger failed: {str(e)}",
        )


@router.post(
    "/{sos_id}/resolve",
    summary="Resolve SOS alert",
    description="Mark yourself as safe and resolve the active SOS alert.",
)
async def resolve_sos(
    sos_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Resolve an active SOS alert."""
    try:
        result = await sos_service.resolve_sos(current_user["id"], sos_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{sos_id}/cancel",
    summary="Cancel SOS alert",
    description="Cancel an SOS alert (false alarm). Notifies contacts.",
)
async def cancel_sos(
    sos_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Cancel an SOS alert (false alarm)."""
    try:
        result = await sos_service.cancel_sos(current_user["id"], sos_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/active",
    summary="Get active SOS",
    description="Get the currently active SOS alert for the user.",
)
async def get_active(current_user: dict = Depends(get_current_user)):
    """Get active SOS alert."""
    result = await sos_service.get_active_sos(current_user["id"])
    return {"active_alert": result}


@router.get(
    "/history",
    summary="SOS history",
    description="Get past SOS alerts.",
)
async def get_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Get SOS alert history."""
    items = await sos_service.get_sos_history(current_user["id"], limit=limit)
    return {"items": items, "total": len(items)}
