"""
MatruSakhi Content API Routes
Endpoints for educational health content.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.api.middleware.auth_middleware import get_current_user
from app.schemas.content import (
    ContentCreateRequest,
    ContentResponse,
    ContentListResponse,
)
from app.services import content_service

router = APIRouter(prefix="/api/content", tags=["Content"])


@router.get(
    "/",
    response_model=ContentListResponse,
    summary="List content",
    description="Get educational health content with optional filters.",
)
async def list_content(
    category: Optional[str] = Query(None, description="Filter by category"),
    content_type: Optional[str] = Query(None, description="Filter by type (article, tip, faq)"),
    pregnancy_week: Optional[int] = Query(None, ge=1, le=42, description="Filter relevant to pregnancy week"),
    search: Optional[str] = Query(None, description="Search in content"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """
    List educational content. This endpoint is public (no auth required) 
    to allow guest access to health information.
    """
    return await content_service.get_content_list(
        category=category,
        content_type=content_type,
        pregnancy_week=pregnancy_week,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/recommended",
    summary="Get recommended content",
    description="Get personalized article recommendations based on user profile.",
)
async def get_recommended(
    pregnancy_week: Optional[int] = Query(None, ge=1, le=42),
    limit: int = Query(8, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
):
    """Get personalized content recommendations."""
    user_id = str(current_user["_id"])
    week = pregnancy_week or current_user.get("profile", {}).get("pregnancy_week")
    return await content_service.get_recommended_content(
        user_id=user_id,
        pregnancy_week=week,
        limit=limit,
    )


@router.get(
    "/{content_id}",
    response_model=ContentResponse,
    summary="Get content",
    description="Get a specific content article.",
)
async def get_content(content_id: str):
    """Get a specific content item (public access)."""
    content = await content_service.get_content_by_id(content_id)
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return content


@router.post(
    "/{content_id}/like",
    summary="Like content",
    description="Like a content article.",
)
async def like_content(
    content_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Like a content item."""
    liked = await content_service.like_content(content_id)
    if not liked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return {"message": "Content liked"}


@router.post(
    "/",
    response_model=ContentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create content (Admin)",
    description="Create new educational content. Admin access required.",
)
async def create_content(
    request: ContentCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create new content (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create content",
        )
    try:
        return await content_service.create_content(request.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/seed",
    summary="Seed content",
    description="Initialize the database with default educational content.",
)
async def seed_content():
    """Seed default educational content."""
    count = await content_service.seed_content()
    return {"message": f"{count} content items available"}
