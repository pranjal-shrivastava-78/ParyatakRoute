"""Chat Service for ParyatakRoute Travel Assistant.

Provides context-aware conversational AI powered by Groq AI,
with trip/itinerary context pruning and strict user ownership verification.
"""
from datetime import datetime, timezone
from typing import Optional

from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.logging import logger
from app.repositories.itinerary_repository import itinerary_repository
from app.repositories.trip_repository import trip_repository
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.groq_service import groq_service


class ChatService:
    async def handle_chat(self, user_id: str, request: ChatRequest) -> ChatResponse:
        """
        Process user message with ownership-verified, token-pruned trip context.
        """
        trip_context_applied = False
        itinerary_context_applied = False
        context_parts = []

        # 1. Trip context with BOLA ownership check
        if request.trip_id:
            trip = await trip_repository.get_by_id(request.trip_id)
            if not trip:
                raise NotFoundException("Trip not found", code="TRIP_NOT_FOUND")
            if trip.user_id != user_id:
                raise ForbiddenException("You do not have permission to access this trip", code="FORBIDDEN")

            trip_context_applied = True
            interests_str = ", ".join(trip.interests) if trip.interests else "general exploration"
            context_parts.append(
                f"TRIP CONTEXT:\n"
                f"- Destination: {trip.destination}\n"
                f"- Dates: {trip.start_date} to {trip.end_date} ({trip.duration_days} days)\n"
                f"- Travellers: {trip.travellers} | Style: {trip.travel_style}\n"
                f"- Budget: {trip.currency} {trip.budget:,.0f} | Interests: {interests_str}\n"
                f"- Dietary: {trip.dietary_preferences or 'None'}"
            )

        # 2. Itinerary context with BOLA ownership check
        if request.itinerary_id:
            itin = await itinerary_repository.get_by_id(request.itinerary_id)
            if not itin:
                raise NotFoundException("Itinerary not found", code="ITINERARY_NOT_FOUND")
            if itin.user_id != user_id:
                raise ForbiddenException("You do not have permission to access this itinerary", code="FORBIDDEN")

            itinerary_context_applied = True
            # Token pruning: extract concise 1-line themes per day rather than dumping thousands of JSON tokens
            day_highlights = []
            for d in itin.days[:7]:  # Limit to first 7 days for prompt brevity
                act_names = ", ".join(a.name for a in d.activities[:3])
                day_highlights.append(f"  Day {d.day_number} ({d.theme or 'Exploration'}): {act_names}")

            context_parts.append(
                f"SAVED ITINERARY:\n"
                f"- Title: {itin.title}\n"
                f"- Summary: {itin.summary}\n"
                f"- Estimated Cost: {itin.budget.currency} {itin.budget.total_estimated:,.0f}\n"
                f"- Plan Outline:\n" + "\n".join(day_highlights)
            )

        # 3. System prompt formulation with strict guardrails
        user_context_block = "\n\n".join(context_parts) if context_parts else "No specific trip attached."
        system_prompt = (
            "You are ParyatakRoute's expert, friendly travel assistant. "
            "Help travellers plan, optimize, and navigate their journeys.\n\n"
            "CRITICAL GUARDRAILS:\n"
            "1. Be concise, polite, and practically helpful.\n"
            "2. Never claim unverified prices, live ticketing, or opening hours. Clarify they are estimates and advise checking official sources.\n"
            "3. Focus on local culture, pacing, logistics, weather tips, and hidden gems.\n\n"
            f"USER JOURNEY CONTEXT:\n{user_context_block}"
        )

        # 4. Format history
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]

        # 5. Call Groq
        reply = await groq_service.chat(
            user_message=request.message,
            system_prompt=system_prompt,
            history=history_dicts,
        )

        return ChatResponse(
            reply=reply,
            trip_context_applied=trip_context_applied,
            itinerary_context_applied=itinerary_context_applied,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


chat_service = ChatService()
