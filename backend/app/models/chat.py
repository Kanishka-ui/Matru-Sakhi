"""
MatruSakhi Chat Model
MongoDB document structure for AI chat conversations.
"""

from datetime import datetime, timezone
from typing import Optional


def create_conversation_document(
    user_id: str,
    title: str = "New Conversation",
) -> dict:
    """Create a new chat conversation document."""
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "title": title,
        "messages": [],
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }


def create_message_document(
    role: str,
    content: str,
    metadata: Optional[dict] = None,
) -> dict:
    """Create a chat message sub-document (role: 'user' or 'assistant')."""
    return {
        "role": role,
        "content": content,
        "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc),
    }


def conversation_serializer(conv: dict) -> dict:
    """Serialize a conversation for API response."""
    return {
        "id": str(conv["_id"]),
        "user_id": conv.get("user_id", ""),
        "title": conv.get("title", "New Conversation"),
        "messages": [
            {
                "role": m["role"],
                "content": m["content"],
                "metadata": m.get("metadata", {}),
                "timestamp": m.get("timestamp", ""),
            }
            for m in conv.get("messages", [])
        ],
        "is_active": conv.get("is_active", True),
        "created_at": conv.get("created_at", ""),
        "updated_at": conv.get("updated_at", ""),
    }
