from fastapi import APIRouter, Depends, HTTPException, status
from app.api.middleware.auth_middleware import get_current_user
from app.services import partner_service

router = APIRouter(prefix="/api/partner", tags=["Partner Mode"])


@router.get(
    "/dashboard",
    summary="Get Partner Dashboard",
    description="Fetch read-only supportive summary for the linked partner.",
)
async def get_partner_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "partner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only partner accounts can access this context.")
    
    try:
        data = await partner_service.get_partner_dashboard(current_user["id"])
        return data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/link/generate",
    summary="Generate Invite",
    description="Mother generates a secure sharing link for her partner.",
)
async def generate_invite(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "mother":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mothers can generate partner invites.")
    
    link = await partner_service.generate_invite_link(current_user["id"])
    return {"invite_url": link}


@router.post(
    "/link/accept",
    summary="Accept Invite",
    description="Partner accepts the secure invite linking the two accounts.",
)
async def accept_invite(secure_token: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "partner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only partner accounts can accept this invite.")
    
    success = await partner_service.link_partner(current_user["id"], secure_token)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invite token.")
    return {"message": "Accounts linked safely!"}
