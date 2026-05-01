"""
MatruSakhi Chat Schemas
Pydantic models for chat request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChatMessageRequest(BaseModel):
    """Schema for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID, or null for new")


class ChatMessageItem(BaseModel):
    """A single chat message."""
    role: str
    content: str
    metadata: dict = {}
    timestamp: Optional[datetime] = None


class ChatConversationResponse(BaseModel):
    """Chat conversation response."""
    id: str
    user_id: str
    title: str
    messages: list[ChatMessageItem] = []
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ChatResponse(BaseModel):
    """Response after sending a chat message."""
    conversation_id: str
    user_message: ChatMessageItem
    assistant_message: ChatMessageItem


class ConversationListItem(BaseModel):
    """Summary of a conversation for list view."""
    id: str
    title: str
    message_count: int = 0
    last_message_preview: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
