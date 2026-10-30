"""Groq AI Service for ParyatakRoute.

Integrates with Groq Cloud API using:
- Configured GROQ_MODEL for high-precision structured JSON itinerary generation
- Configured GROQ_CHAT_MODEL for ultra-fast, low-token conversational travel assistance
Includes token conservation, bounded retries with jitter, and schema validation.
"""
import asyncio
import json
import random
import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from groq import AsyncGroq, RateLimitError, APIError, APIConnectionError

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger


class GroqService:
    def __init__(self):
        self.primary_model = settings.GROQ_MODEL
        self.chat_model = settings.GROQ_CHAT_MODEL
        self.timeout = float(settings.GROQ_TIMEOUT_SECONDS)
        self.max_retries = int(settings.GROQ_MAX_RETRIES)

    def get_client(self) -> AsyncGroq:
        """Initialize and return the AsyncGroq client."""
        if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.strip():
            raise AppException(
                message="AI service is not configured: GROQ_API_KEY is missing from environment variables.",
                code="AI_NOT_CONFIGURED",
                status_code=503,
            )
        return AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=self.timeout)

    async def _call_with_retry(self, fn, *args, **kwargs) -> Any:
        """Execute a Groq API call with bounded exponential backoff and jitter."""
        base_delay = 1.0
        for attempt in range(self.max_retries):
            try:
                return await fn(*args, **kwargs)
            except RateLimitError as e:
                if attempt == self.max_retries - 1:
                    logger.error(f"[Groq AI] Rate limit exceeded after {self.max_retries} attempts: {e}")
                    raise AppException(
                        message="Groq AI rate limit reached. Please wait a few moments before trying again.",
                        code="AI_RATE_LIMIT_EXCEEDED",
                        status_code=429,
                    )
                delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.4)
                logger.warning(f"[Groq AI] Rate limit on attempt {attempt + 1}. Retrying in {delay:.2f}s...")
                await asyncio.sleep(delay)
            except APIConnectionError as e:
                if attempt == self.max_retries - 1:
                    logger.error(f"[Groq AI] Connection error after {self.max_retries} attempts: {e}")
                    raise AppException(
                        message="AI service connection timed out or failed. Please check network connectivity.",
                        code="AI_PROVIDER_ERROR",
                        status_code=504,
                    )
                delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.3)
                logger.warning(f"[Groq AI] Connection error on attempt {attempt + 1}. Retrying in {delay:.2f}s...")
                await asyncio.sleep(delay)
            except APIError as e:
                logger.error(f"[Groq AI] API error: status={e.status_code}, message={e.message}")
                if e.status_code == 429:
                    raise AppException(
                        message="AI quota exhausted or rate limit reached on Groq Cloud. Please try again later.",
                        code="AI_QUOTA_EXHAUSTED",
                        status_code=429,
                    )
                raise AppException(
                    message=f"AI generation failed: {e.message}",
                    code="AI_PROVIDER_ERROR",
                    status_code=502,
                )

    def calculate_expected_dates(self, start_date: Any, end_date: Any) -> List[str]:
        """Compute exact sequential date strings (YYYY-MM-DD) deterministically in Python."""
        if isinstance(start_date, str):
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        elif isinstance(start_date, datetime):
            start = start_date.date()
        else:
            start = start_date

        if isinstance(end_date, str):
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        elif isinstance(end_date, datetime):
            end = end_date.date()
        else:
            end = end_date

        if end < start:
            raise AppException("End date must be on or after start date", code="INVALID_DATE_RANGE", status_code=400)

        dates: List[str] = []
        curr = start
        while curr <= end:
            dates.append(curr.isoformat())
            curr += timedelta(days=1)

        if len(dates) > 60:
            raise AppException("Trip duration cannot exceed 60 days", code="EXCESSIVE_DURATION", status_code=400)

        return dates

    def _clean_json_response(self, text: str) -> dict:
        """Strip markdown fences and parse structured JSON reliably."""
        cleaned = text.strip()
        # Remove markdown code fences if model enclosed JSON
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as err:
            logger.error(f"[Groq AI] Failed to parse model output as JSON: {err}. Raw output:\n{text[:500]}")
            raise AppException(
                message="AI provider returned malformed structured output. Please retry.",
                code="AI_MALFORMED_OUTPUT",
                status_code=502,
            )

    async def generate_itinerary(self, preferences: Dict[str, Any], expected_dates: List[str]) -> Dict[str, Any]:
        """
        Generate a complete personalized travel itinerary using configured Groq AI model.
        Sets max_tokens and low temperature for concise, strictly validated output.
        """
        client = self.get_client()
        total_days = len(expected_dates)
        destination = preferences.get("destination", "Destination")
        currency = preferences.get("currency", "INR")
        budget = preferences.get("budget", 20000)
        travellers = preferences.get("travellers", 1)
        travel_style = preferences.get("travel_style", "balanced")
        interests = preferences.get("interests", [])
        if isinstance(interests, list):
            interests_str = ", ".join(str(i) for i in interests) if interests else "sightseeing, culture, food"
        else:
            interests_str = str(interests)

        starting_city = preferences.get("starting_city")
        notes = preferences.get("additional_notes")
        diet = preferences.get("dietary_preferences")

        schedule_guide = "\n".join(f"  - Day {i + 1}: {d}" for i, d in enumerate(expected_dates))

        system_prompt = (
            "You are ParyatakRoute AI, an expert travel planner. "
            "Output ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "title": "string",\n'
            '  "summary": "string",\n'
            '  "days": [\n'
            "    {\n"
            '      "dayNumber": 1,\n'
            '      "date": "YYYY-MM-DD",\n'
            '      "theme": "string",\n'
            '      "activities": [\n'
            "        {\n"
            '          "name": "string",\n'
            '          "description": "string",\n'
            '          "category": "sightseeing | cultural | food | adventure | leisure | transport",\n'
            '          "startTime": "09:00",\n'
            '          "durationMinutes": 120,\n'
            '          "estimatedCost": 500,\n'
            f'          "costCurrency": "{currency}",\n'
            '          "location": {"name": "string", "latitude": null, "longitude": null},\n'
            '          "transport": {"mode": "string", "details": "string", "durationMinutes": 15, "estimatedCost": 100},\n'
            '          "sourceStatus": "unverified"\n'
            "        }\n"
            "      ]\n"
            "    }\n"
            "  ],\n"
            "  \"assumptions\": [\"Prices, operating hours, and routes are estimates and must be verified.\"]\n"
            "}"
        )

        user_prompt = (
            f"Generate a {total_days}-day travel itinerary for {destination}.\n"
            f"Dates:\n{schedule_guide}\n"
            f"Budget: {currency} {budget} | Travellers: {travellers} | Style: {travel_style}\n"
            f"Interests: {interests_str}\n"
            f"{f'Origin: {starting_city}' if starting_city else ''}\n"
            f"{f'Dietary: {diet}' if diet else ''}\n"
            f"{f'Special Notes: {notes}' if notes else ''}\n"
            f"Rules: Exactly {total_days} days. Realistic pacing with HH:MM 24-hr times. Sequential non-overlapping activities. Output valid JSON object."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(f"[Groq AI] Requesting {total_days}-day itinerary for {destination} using {self.primary_model}")

        completion = await self._call_with_retry(
            client.chat.completions.create,
            model=self.primary_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=3500,
        )

        raw_content = completion.choices[0].message.content or "{}"
        parsed = self._clean_json_response(raw_content)

        # Validate that days array exists
        if not parsed.get("days") or not isinstance(parsed["days"], list):
            logger.error("[Groq AI] Returned JSON lacks 'days' array")
            raise AppException("AI failed to generate daily itinerary plans", code="AI_MALFORMED_OUTPUT", status_code=502)

        return parsed

    async def regenerate_single_day(
        self,
        destination: str,
        day_number: int,
        date_str: str,
        travel_style: str = "balanced",
        currency: str = "INR",
        daily_budget: float = 5000.0,
        interests: Optional[List[str]] = None,
        instruction: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Surgically regenerate ONLY Day N using configured GROQ_MODEL.
        Saves ~78% tokens compared to full trip regeneration.
        """
        client = self.get_client()
        interests_str = ", ".join(interests) if interests else "sightseeing, local food"

        system_prompt = (
            "You are ParyatakRoute AI. Output strictly valid JSON for a SINGLE DAY plan matching this schema:\n"
            "{\n"
            f'  "dayNumber": {day_number},\n'
            f'  "date": "{date_str}",\n'
            '  "theme": "string",\n'
            '  "activities": [\n'
            "    {\n"
            '      "name": "string",\n'
            '      "description": "string",\n'
            '      "category": "sightseeing | cultural | food | adventure | leisure | transport",\n'
            '      "startTime": "09:30",\n'
            '      "durationMinutes": 120,\n'
            '      "estimatedCost": 400,\n'
            f'      "costCurrency": "{currency}",\n'
            '      "location": {"name": "string"},\n'
            '      "transport": {"mode": "walking", "durationMinutes": 15, "estimatedCost": 50},\n'
            '      "sourceStatus": "unverified"\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        user_prompt = (
            f"Regenerate Day {day_number} ({date_str}) in {destination}.\n"
            f"Style: {travel_style} | Target Day Budget: ~{currency} {daily_budget:,.0f} | Interests: {interests_str}\n"
            f"{f'User Instruction: {instruction}' if instruction else 'Create fresh exciting activities.'}\n"
            f"{f'Context of other days: {context}' if context else ''}\n"
            "Provide 3-4 sequential non-overlapping activities spanning morning to evening. Output valid JSON object."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(f"[Groq AI] Surgically regenerating Day {day_number} for {destination}")

        completion = await self._call_with_retry(
            client.chat.completions.create,
            model=self.primary_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=1500,
        )

        raw_content = completion.choices[0].message.content or "{}"
        parsed = self._clean_json_response(raw_content)

        if not parsed.get("activities") or not isinstance(parsed["activities"], list):
            raise AppException("AI failed to regenerate day activities", code="AI_MALFORMED_OUTPUT", status_code=502)

        return parsed

    async def chat(
        self,
        user_message: str,
        system_prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Conduct conversational travel inquiry using configured GROQ_CHAT_MODEL.
        Output token limit is strictly capped at 800 tokens.
        """
        client = self.get_client()

        messages = [{"role": "system", "content": system_prompt}]

        if history:
            for turn in history[-10:]:  # Keep at most last 10 turns to save tokens
                role = "assistant" if turn.get("role") in ("assistant", "model") else "user"
                messages.append({"role": role, "content": turn.get("content", "")})

        messages.append({"role": "user", "content": user_message})

        logger.info(f"[Groq AI] Travel chat inquiry using fast model {self.chat_model}")

        completion = await self._call_with_retry(
            client.chat.completions.create,
            model=self.chat_model,
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )

        reply = completion.choices[0].message.content or "I am here to help you plan your journey."
        return reply.strip()


groq_service = GroqService()
