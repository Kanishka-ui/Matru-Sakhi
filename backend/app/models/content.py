"""
MatruSakhi Content Model
MongoDB document structure for educational health content.
"""

from datetime import datetime, timezone
from typing import Optional


def create_content_document(
    title: str,
    body: str,
    content_type: str,
    category: str,
    author: str = "MatruSakhi Team",
    tags: list = None,
    pregnancy_week_range: Optional[dict] = None,
    language: str = "en",
    media_url: Optional[str] = None,
) -> dict:
    """
    Create a health content/article document.

    content_type options:
    - article: long-form educational content
    - tip: short health tip
    - faq: frequently asked question
    - video: video content reference
    - infographic: visual content

    category options:
    - nutrition, exercise, mental_health
    - prenatal_care, postnatal_care
    - baby_care, breastfeeding
    - danger_signs, hygiene
    - vaccination, medication
    """
    now = datetime.now(timezone.utc)
    return {
        "title": title,
        "body": body,
        "content_type": content_type,
        "category": category,
        "author": author,
        "tags": tags or [],
        "pregnancy_week_range": pregnancy_week_range,  # {"min": 1, "max": 12}
        "language": language,
        "media_url": media_url,
        "is_published": True,
        "views": 0,
        "likes": 0,
        "created_at": now,
        "updated_at": now,
    }


def content_serializer(content: dict) -> dict:
    """Serialize a content document for API response."""
    return {
        "id": str(content["_id"]),
        "title": content.get("title", ""),
        "body": content.get("body", ""),
        "content_type": content.get("content_type", ""),
        "category": content.get("category", ""),
        "author": content.get("author", ""),
        "tags": content.get("tags", []),
        "pregnancy_week_range": content.get("pregnancy_week_range"),
        "language": content.get("language", "en"),
        "media_url": content.get("media_url"),
        "is_published": content.get("is_published", True),
        "views": content.get("views", 0),
        "likes": content.get("likes", 0),
        "created_at": content.get("created_at", ""),
        "updated_at": content.get("updated_at", ""),
    }
