"""Chat API routes for ParyatakRoute.

Provides conversational AI travel assistant powered by Groq AI
with journey context awareness and strict ownership verification.
"""
from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import APIResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=APIResponse[ChatResponse], status_code=status.HTTP_200_OK)
async def chat_interaction(
    request: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ChatResponse]:
    """Interact with ParyatakRoute Travel Assistant AI powered by Groq."""
    response = await chat_service.handle_chat(current_user.id, request)
    return APIResponse(success=True, data=response)
