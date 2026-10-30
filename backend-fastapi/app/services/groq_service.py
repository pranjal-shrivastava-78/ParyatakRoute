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
                if attempt < self.max_retries - 1 and (e.status_code in (500, 502, 503) or "json_validate_failed" in str(e)):
                    delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.4)
                    logger.warning(f"[Groq AI] Retrying transient error ({e.message}) on attempt {attempt + 1} in {delay:.2f}s...")
                    await asyncio.sleep(delay)
                    continue
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

    CHUNK_SIZE = 3

    async def _generate_single_chunk(
        self,
        client: AsyncGroq,
        preferences: Dict[str, Any],
        expected_dates: List[str],
        destination: str,
        currency: str,
        budget: float,
        travellers: int,
        travel_style: str,
        interests_str: str,
        starting_city: Optional[str],
        notes: Optional[str],
        diet: Optional[str],
    ) -> Dict[str, Any]:
        """Generate a complete itinerary in a single API call for short trips (<= 3 days)."""
        total_days = len(expected_dates)
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

        if not parsed.get("days") or not isinstance(parsed["days"], list):
            logger.error("[Groq AI] Returned JSON lacks 'days' array")
            raise AppException("AI failed to generate daily itinerary plans", code="AI_MALFORMED_OUTPUT", status_code=502)

        return parsed

    async def generate_itinerary(self, preferences: Dict[str, Any], expected_dates: List[str]) -> Dict[str, Any]:
        """
        Generate a complete personalized travel itinerary using configured Groq AI model.
        For itineraries exceeding 3 days, uses chunked multi-day generation to safely stay
        within Groq completion token ceilings while preserving chronological cohesion.
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

        # For itineraries of 3 days or fewer, generate in a single call
        if total_days <= self.CHUNK_SIZE:
            return await self._generate_single_chunk(
                client, preferences, expected_dates, destination, currency,
                budget, travellers, travel_style, interests_str, starting_city, notes, diet
            )

        # For longer itineraries (>3 days), perform chunked generation to prevent token truncation
        logger.info(f"[Groq AI] Initiating chunked generation for {total_days}-day itinerary in batches of {self.CHUNK_SIZE} days")
        all_days: List[Dict[str, Any]] = []
        base_title: str = f"Trip to {destination}"
        base_summary: str = f"A {total_days}-day travel itinerary for {destination}."
        base_assumptions: List[str] = ["Prices, operating hours, and routes are estimates and must be verified."]

        date_chunks = [
            expected_dates[i : i + self.CHUNK_SIZE]
            for i in range(0, total_days, self.CHUNK_SIZE)
        ]

        day_offset = 1
        previous_themes: List[str] = []

        for chunk_idx, chunk_dates in enumerate(date_chunks):
            is_first = (chunk_idx == 0)
            chunk_day_nums = list(range(day_offset, day_offset + len(chunk_dates)))
            schedule_guide = "\n".join(f"  - Day {num}: {d}" for num, d in zip(chunk_day_nums, chunk_dates))

            if is_first:
                system_prompt = (
                    "You are ParyatakRoute AI, an expert travel planner. "
                    "Output ONLY valid JSON matching this schema:\n"
                    "{\n"
                    '  "title": "string",\n'
                    '  "summary": "string",\n'
                    '  "days": [\n'
                    "    {\n"
                    f'      "dayNumber": {chunk_day_nums[0]},\n'
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
                    f"Generate the first {len(chunk_dates)} days (Day {chunk_day_nums[0]} to Day {chunk_day_nums[-1]}) of a {total_days}-day travel itinerary for {destination}.\n"
                    f"Dates:\n{schedule_guide}\n"
                    f"Budget: {currency} {budget} | Travellers: {travellers} | Style: {travel_style}\n"
                    f"Interests: {interests_str}\n"
                    f"{f'Origin: {starting_city}' if starting_city else ''}\n"
                    f"{f'Dietary: {diet}' if diet else ''}\n"
                    f"{f'Special Notes: {notes}' if notes else ''}\n"
                    f"Rules: Exactly {len(chunk_dates)} days numbered {chunk_day_nums[0]} to {chunk_day_nums[-1]}. Sequential non-overlapping activities. Output valid JSON object."
                )
            else:
                system_prompt = (
                    "You are ParyatakRoute AI, an expert travel planner. "
                    "Output ONLY valid JSON matching this schema:\n"
                    "{\n"
                    '  "days": [\n'
                    "    {\n"
                    f'      "dayNumber": {chunk_day_nums[0]},\n'
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
                    "  ]\n"
                    "}"
                )
                prev_context = "; ".join(previous_themes) if previous_themes else "Initial exploration"
                user_prompt = (
                    f"Continue the travel itinerary '{base_title}' for {destination}.\n"
                    f"Previous days covered: {prev_context}.\n"
                    f"Generate schedule for Day {chunk_day_nums[0]} to Day {chunk_day_nums[-1]}.\n"
                    f"Dates:\n{schedule_guide}\n"
                    f"Style: {travel_style} | Interests: {interests_str}\n"
                    f"Rules: Exactly {len(chunk_dates)} days numbered {chunk_day_nums[0]} to {chunk_day_nums[-1]}. Sequential non-overlapping activities. Output valid JSON with 'days' array."
                )

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            logger.info(f"[Groq AI] Requesting chunk {chunk_idx + 1}/{len(date_chunks)} (Days {chunk_day_nums[0]}-{chunk_day_nums[-1]}) for {destination}")

            completion = await self._call_with_retry(
                client.chat.completions.create,
                model=self.primary_model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=3000,
            )

            raw_content = completion.choices[0].message.content or "{}"
            parsed = self._clean_json_response(raw_content)

            chunk_days = parsed.get("days", [])
            if not isinstance(chunk_days, list) or len(chunk_days) == 0:
                logger.error(f"[Groq AI] Chunk {chunk_idx + 1} returned no days")
                raise AppException(
                    f"AI failed to generate days {chunk_day_nums[0]}-{chunk_day_nums[-1]} in chunked generation",
                    code="AI_MALFORMED_OUTPUT",
                    status_code=502,
                )

            if is_first:
                base_title = parsed.get("title", base_title)
                base_summary = parsed.get("summary", base_summary)
                if parsed.get("assumptions"):
                    base_assumptions = parsed["assumptions"]

            for day_item in chunk_days:
                theme = day_item.get("theme", "")
                if theme:
                    previous_themes.append(f"Day {day_item.get('dayNumber')}: {theme}")
                all_days.append(day_item)

            day_offset += len(chunk_dates)

        return {
            "title": base_title,
            "summary": base_summary,
            "days": all_days,
            "assumptions": base_assumptions,
        }

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
