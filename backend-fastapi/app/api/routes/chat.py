"""Chat API routes for ParyatakRoute.

Provides conversational AI travel assistant powered by Groq AI
with journey context awareness and strict ownership verification.
"""
from typing import Optional
from fastapi import APIRouter, Depends, status

from app.core.security import get_optional_current_user, AuthenticatedUser, GUEST_USER_ID
from app.schemas.common import APIResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=APIResponse[ChatResponse], status_code=status.HTTP_200_OK, summary="Travel Assistant AI Chat (Public & Authenticated)")
async def chat_interaction(
    request: ChatRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> APIResponse[ChatResponse]:
    """Interact with ParyatakRoute Travel Assistant AI powered by Groq. Accessible to all visitors."""
    user_id = current_user.id if current_user else GUEST_USER_ID
    response = await chat_service.handle_chat(user_id, request)
    return APIResponse(success=True, data=response)
