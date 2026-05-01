"""
MatruSakhi Content Schemas
Pydantic models for educational health content.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ContentType(str, Enum):
    ARTICLE = "article"
    TIP = "tip"
    FAQ = "faq"
    VIDEO = "video"
    INFOGRAPHIC = "infographic"


class ContentCategory(str, Enum):
    NUTRITION = "nutrition"
    EXERCISE = "exercise"
    MENTAL_HEALTH = "mental_health"
    PRENATAL_CARE = "prenatal_care"
    POSTNATAL_CARE = "postnatal_care"
    BABY_CARE = "baby_care"
    BREASTFEEDING = "breastfeeding"
    DANGER_SIGNS = "danger_signs"
    HYGIENE = "hygiene"
    VACCINATION = "vaccination"
    MEDICATION = "medication"


class ContentCreateRequest(BaseModel):
    """Create new content (admin only)."""
    title: str = Field(..., min_length=3, max_length=300)
    body: str = Field(..., min_length=10)
    content_type: ContentType
    category: ContentCategory
    author: str = "MatruSakhi Team"
    tags: list[str] = []
    pregnancy_week_min: Optional[int] = Field(None, ge=1, le=42)
    pregnancy_week_max: Optional[int] = Field(None, ge=1, le=42)
    language: str = "en"
    media_url: Optional[str] = None


class ContentResponse(BaseModel):
    """Content response."""
    id: str
    title: str
    body: str
    content_type: str
    category: str
    author: str
    tags: list[str] = []
    pregnancy_week_range: Optional[dict] = None
    language: str = "en"
    media_url: Optional[str] = None
    is_published: bool = True
    views: int = 0
    likes: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ContentListResponse(BaseModel):
    """List of content."""
    items: list[ContentResponse]
    total: int
    page: int
    page_size: int
