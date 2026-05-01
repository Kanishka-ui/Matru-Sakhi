"""
MatruSakhi Chat API Routes
Endpoints for AI chatbot conversations.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.middleware.auth_middleware import get_current_user
from app.schemas.chat import (
    ChatMessageRequest,
    ChatResponse,
    ChatConversationResponse,
    ConversationListItem,
)
from app.services import chat_service, health_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post(
    "/send",
    response_model=ChatResponse,
    summary="Send a chat message",
    description="Send a message and receive an AI response. Creates a new conversation if no conversation_id is provided.",
)
async def send_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message to the AI chatbot."""
    try:
        profile = current_user.get("profile", {})
        health_summary = await health_service.get_health_summary(
            user_id=current_user["id"],
            user_profile=profile
        )

        user_context = {
            "name": current_user.get("full_name"),
            "pregnancy_display": health_summary.get("pregnancy_display"),
            "trimester": health_summary.get("trimester"),
            "blood_group": profile.get("blood_group"),
            "age": profile.get("age"),
            "latest_mood": health_summary.get("latest_mood"),
            "recent_symptoms": health_summary.get("recent_symptoms", []),
            "latest_vitals": health_summary.get("latest_vitals", {}),
        }

        result = await chat_service.send_message(
            user_id=current_user["id"],
            message=request.message,
            conversation_id=request.conversation_id,
            user_context=user_context,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Chat error: {str(e)}")


@router.get(
    "/conversations",
    response_model=list[ConversationListItem],
    summary="List conversations",
    description="Get all conversations for the current user.",
)
async def list_conversations(
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """List all chat conversations."""
    return await chat_service.list_conversations(
        user_id=current_user["id"], limit=limit, skip=skip
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ChatConversationResponse,
    summary="Get conversation",
    description="Get a specific conversation with all messages.",
)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific conversation."""
    conv = await chat_service.get_conversation(
        user_id=current_user["id"], conversation_id=conversation_id
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


@router.delete(
    "/conversations/{conversation_id}",
    summary="Delete conversation",
    description="Delete a specific conversation.",
)
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a conversation."""
    deleted = await chat_service.delete_conversation(
        user_id=current_user["id"], conversation_id=conversation_id
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return {"message": "Conversation deleted successfully"}
