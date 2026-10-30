"""Itinerary Service for ParyatakRoute.

Handles itinerary generation, single-day regeneration, budget recalculation,
and ownership verification with Groq AI quota optimization and request deduplication.
"""
import asyncio
import time
from datetime import datetime, timezone, date
from typing import List, Dict, Any, Optional

from app.core.exceptions import NotFoundException, ForbiddenException, AppException
from app.core.security import GUEST_USER_ID
from app.core.logging import logger
from app.repositories.itinerary_repository import itinerary_repository
from app.repositories.trip_repository import trip_repository
from app.schemas.itinerary import (
    ItineraryResponse,
    ItineraryUpdate,
    BudgetBreakdownAnalysis,
    BudgetCategoryBreakdown,
    ItineraryBudget,
    DayPlan,
    Activity,
    ActivityLocation,
    ActivityTransport,
    GenerateItineraryRequest,
)
from app.schemas.trip import TripCreate
from app.services.groq_service import groq_service

# Deduplication locks and cache
_in_flight_locks: Dict[str, asyncio.Lock] = {}
_generation_cache: Dict[str, tuple[ItineraryResponse, float]] = {}


def parse_safe_float(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        import re
        cleaned = re.sub(r"[^\d.-]", "", val)
        try:
            return float(cleaned) if cleaned else default
        except ValueError:
            return default
    return default


class ItineraryService:
    async def get_itinerary(self, itinerary_id: str, user_id: Optional[str] = None) -> ItineraryResponse:
        itin = await itinerary_repository.get_by_id(itinerary_id)
        if not itin:
            raise NotFoundException("Itinerary not found", code="ITINERARY_NOT_FOUND")
        if itin.user_id != GUEST_USER_ID:
            if not user_id or user_id == GUEST_USER_ID or itin.user_id != user_id:
                raise ForbiddenException("You do not have permission to view this private itinerary", code="FORBIDDEN")
        return itin

    async def get_itinerary_by_trip(self, trip_id: str, user_id: Optional[str] = None) -> ItineraryResponse:
        trip = await trip_repository.get_by_id(trip_id)
        if not trip:
            raise NotFoundException("Trip not found", code="TRIP_NOT_FOUND")
        if trip.user_id != GUEST_USER_ID:
            if not user_id or user_id == GUEST_USER_ID or trip.user_id != user_id:
                raise ForbiddenException("You do not have permission to view itineraries for this trip", code="FORBIDDEN")
        itins = await itinerary_repository.list_by_trip(trip_id)
        if itins:
            return itins[0]
        raise NotFoundException("No itinerary found for this trip", code="ITINERARY_NOT_FOUND")

    async def list_by_trip(self, trip_id: str, user_id: str) -> List[ItineraryResponse]:
        trip = await trip_repository.get_by_id(trip_id)
        if not trip:
            raise NotFoundException("Trip not found", code="TRIP_NOT_FOUND")
        if trip.user_id != GUEST_USER_ID:
            if not user_id or user_id == GUEST_USER_ID or trip.user_id != user_id:
                raise ForbiddenException("You do not have permission to view itineraries for this trip", code="FORBIDDEN")
        return await itinerary_repository.list_by_trip(trip_id)

    async def generate_and_save_itinerary(
        self,
        user_id: str,
        request: GenerateItineraryRequest,
    ) -> ItineraryResponse:
        """
        Generate and persist a complete itinerary for a trip.
        Implements token conservation:
        - Checks for existing itinerary if regenerate is False (saves 100% LLM calls)
        - In-flight request locking prevents concurrent duplicate submissions
        - Privacy-safe cache with 15-minute TTL per user/trip
        """
        trip_id = request.trip_id
        trip_data: Optional[Any] = None
        from app.core.security import GUEST_USER_ID

        if trip_id:
            trip_data = await trip_repository.get_by_id(trip_id)
            if not trip_data:
                raise NotFoundException("Trip not found", code="TRIP_NOT_FOUND")
            if user_id != GUEST_USER_ID and trip_data.user_id != GUEST_USER_ID and trip_data.user_id != user_id:
                raise ForbiddenException("You do not have permission to generate an itinerary for this trip", code="FORBIDDEN")

            # Token saving: If regenerate is False and an itinerary already exists, return it!
            if not request.regenerate:
                existing_itins = await itinerary_repository.list_by_trip(trip_id)
                if existing_itins:
                    logger.info(f"[ItineraryService] Reusing existing itinerary for trip {trip_id} (0 LLM tokens used)")
                    return existing_itins[0]
        else:
            # Trip preferences passed without trip_id: create trip first
            prefs = request.preferences or {}
            new_trip_in = TripCreate(**prefs)
            created_trip = await trip_repository.create(user_id, new_trip_in)
            trip_id = created_trip.id
            trip_data = created_trip

        # Deduplication lock key per user and trip
        lock_key = f"{user_id}:{trip_id}"
        if lock_key not in _in_flight_locks:
            _in_flight_locks[lock_key] = asyncio.Lock()

        async with _in_flight_locks[lock_key]:
            # Check cache under lock
            if not request.regenerate and lock_key in _generation_cache:
                cached_itin, exp = _generation_cache[lock_key]
                if exp > time.time():
                    logger.info(f"[ItineraryService] Cache hit for {lock_key} (0 LLM tokens used)")
                    return cached_itin

            # Consolidate preferences
            prefs_dict = trip_data.model_dump() if hasattr(trip_data, "model_dump") else dict(trip_data)
            if request.preferences:
                prefs_dict.update(request.preferences)

            # Deterministic date calculation in Python
            start_date = prefs_dict.get("start_date")
            end_date = prefs_dict.get("end_date")
            expected_dates = groq_service.calculate_expected_dates(start_date, end_date)

            # Generate via Groq Cloud
            raw_plan = await groq_service.generate_itinerary(prefs_dict, expected_dates)

            # Parse and normalize days
            normalized_days: List[DayPlan] = []
            for d in raw_plan.get("days", []):
                day_num = int(d.get("dayNumber", d.get("day_number", len(normalized_days) + 1)))
                date_str = str(d.get("date", expected_dates[min(day_num - 1, len(expected_dates) - 1)]))
                theme = d.get("theme", f"Day {day_num} Exploration")

                acts: List[Activity] = []
                for a in d.get("activities", []):
                    # Location
                    loc_raw = a.get("location") or {}
                    loc = ActivityLocation(
                        name=loc_raw.get("name") or a.get("name") or "Local Area",
                        latitude=loc_raw.get("latitude"),
                        longitude=loc_raw.get("longitude"),
                    )

                    # Transport parsing with fallback and resilient number conversion
                    trans_raw = a.get("transport") or {}
                    act_name = str(a.get("name", "Scheduled Activity"))
                    act_cat = str(a.get("category", "sightseeing")).lower()
                    act_cost_raw = a.get("estimatedCost", a.get("estimated_cost", a.get("cost", a.get("price"))))
                    act_cost = parse_safe_float(act_cost_raw, default=0.0)

                    trans_cost_raw = trans_raw.get("estimatedCost", trans_raw.get("estimated_cost", trans_raw.get("cost")))
                    trans_cost = parse_safe_float(trans_cost_raw, default=0.0)

                    # Bidirectional cost synchronization:
                    # If activity cost is 0 but transport has positive cost (e.g. flight/train/cab leg), use it
                    if act_cost <= 0.0 and trans_cost > 0.0:
                        act_cost = trans_cost
                    if trans_cost <= 0.0 and act_cost > 0.0 and ("transport" in act_cat or "transit" in act_cat or "flight" in act_name.lower() or "train" in act_name.lower() or "bus" in act_name.lower()):
                        trans_cost = act_cost

                    starting_city = prefs_dict.get("starting_city")
                    dest_city = prefs_dict.get("destination")
                    trans_start = trans_raw.get("startPoint") or trans_raw.get("start_point")
                    trans_dest = trans_raw.get("destination") or trans_raw.get("end_point")

                    is_intercity = "flight" in act_name.lower() or "train" in act_name.lower() or "bus" in act_name.lower() or "intercity" in act_name.lower()
                    if not trans_start and starting_city and is_intercity:
                        trans_start = starting_city
                    if not trans_dest and dest_city and is_intercity:
                        trans_dest = dest_city

                    trans_mode = trans_raw.get("mode") or ("transit" if "transport" in act_cat else "walking")
                    trans_dur = int(parse_safe_float(trans_raw.get("durationMinutes", trans_raw.get("duration_minutes", 15))))
                    trans_dist = int(parse_safe_float(trans_raw.get("distanceMeters", trans_raw.get("distance_meters", 0)))) or None

                    trans = ActivityTransport(
                        mode=trans_mode,
                        details=trans_raw.get("details"),
                        duration_minutes=trans_dur,
                        estimated_cost=trans_cost,
                        distance_meters=trans_dist,
                        start_point=trans_start,
                        destination=trans_dest,
                    )

                    acts.append(
                        Activity(
                            name=act_name,
                            description=str(a.get("description", "Explore the destination attractions.")),
                            category=act_cat,
                            start_time=str(a.get("startTime", a.get("start_time", "09:30"))),
                            duration_minutes=int(parse_safe_float(a.get("durationMinutes", a.get("duration_minutes", 90)))),
                            estimated_cost=act_cost,
                            cost_currency=prefs_dict.get("currency", "INR"),
                            location=loc,
                            transport=trans,
                            source_status="unverified",
                        )
                    )

                normalized_days.append(DayPlan(day_number=day_num, date=date_str, theme=theme, activities=acts))

            # Deterministic budget recalculation in Python
            recalculated_budget = self.recalculate_budget(normalized_days, prefs_dict.get("currency", "INR"))

            # Build record to persist
            itinerary_record = {
                "trip_id": trip_id,
                "user_id": user_id,
                "title": raw_plan.get("title", f"Trip to {prefs_dict.get('destination', 'Destination')}"),
                "summary": raw_plan.get("summary", "A personalized travel itinerary created by ParyatakRoute."),
                "status": "generated",
                "days": [d.model_dump() for d in normalized_days],
                "budget": recalculated_budget.model_dump(),
                "assumptions": [
                    "Prices, operating hours, and travel times are model-estimated and must be independently verified.",
                    "ParyatakRoute does not guarantee third-party vendor availability or current ticketing rates.",
                ],
                "generation_metadata": {
                    "provider": "groq",
                    "model": groq_service.primary_model,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "total_days": len(normalized_days),
                    "token_optimization": True,
                },
            }

            saved = await itinerary_repository.create(itinerary_record)
            _generation_cache[lock_key] = (saved, time.time() + 900)
            return saved

    async def regenerate_day_and_save(
        self,
        itinerary_id: str,
        day_number: int,
        user_id: str,
        instruction: Optional[str] = None,
    ) -> ItineraryResponse:
        """
        Surgically regenerate ONLY Day N activities without modifying other days.
        Saves ~78% of tokens compared to regenerating the entire multi-day trip.
        """
        itin = await self.get_itinerary(itinerary_id, user_id)
        parent_trip = await trip_repository.get_by_id(itin.trip_id)

        target_day: Optional[DayPlan] = None
        target_index: int = -1
        for idx, d in enumerate(itin.days):
            if d.day_number == day_number:
                target_day = d
                target_index = idx
                break

        if not target_day or target_index == -1:
            raise NotFoundException(f"Day {day_number} not found in this itinerary", code="INVALID_DAY_NUMBER")

        if parent_trip and parent_trip.destination:
            destination = parent_trip.destination
        else:
            destination = (
                itin.title.replace("Trip to ", "")
                .replace(" Itinerary", "")
                .replace("3-Day ", "")
                .replace("2-Day ", "")
                .strip()
                or "India"
            )
        travel_style = parent_trip.travel_style if parent_trip else "balanced"
        currency = itin.budget.currency
        daily_target = (parent_trip.budget / max(len(itin.days), 1)) if parent_trip else 5000.0

        # Context from adjacent days
        other_themes = [f"Day {d.day_number}: {d.theme}" for d in itin.days if d.day_number != day_number]
        context_str = "; ".join(other_themes[:3])

        # Regenerate target day
        raw_day = await groq_service.regenerate_single_day(
            destination=destination,
            day_number=day_number,
            date_str=target_day.date,
            travel_style=travel_style,
            currency=currency,
            daily_budget=daily_target,
            interests=parent_trip.interests if parent_trip else [],
            instruction=instruction,
            context=context_str,
        )

        new_activities: List[Activity] = []
        for a in raw_day.get("activities", []):
            loc_raw = a.get("location") or {}
            loc = ActivityLocation(
                name=loc_raw.get("name") or a.get("name") or "Local Area",
                latitude=loc_raw.get("latitude"),
                longitude=loc_raw.get("longitude"),
            )
            trans_raw = a.get("transport") or {}
            trans = ActivityTransport(
                mode=trans_raw.get("mode", "walking"),
                details=trans_raw.get("details"),
                duration_minutes=int(trans_raw.get("durationMinutes", trans_raw.get("duration_minutes", 15))),
                estimated_cost=float(trans_raw.get("estimatedCost", trans_raw.get("estimated_cost", 0.0))),
            )
            new_activities.append(
                Activity(
                    name=str(a.get("name", "Scheduled Activity")),
                    description=str(a.get("description", "Explore local highlights.")),
                    category=str(a.get("category", "sightseeing")),
                    start_time=str(a.get("startTime", a.get("start_time", "09:30"))),
                    duration_minutes=int(a.get("durationMinutes", a.get("duration_minutes", 90))),
                    estimated_cost=float(a.get("estimatedCost", a.get("estimated_cost", 0.0))),
                    cost_currency=currency,
                    location=loc,
                    transport=trans,
                    source_status="unverified",
                )
            )

        # Replace target day activities
        updated_days = [d.model_copy(deep=True) for d in itin.days]
        updated_days[target_index].theme = raw_day.get("theme", target_day.theme)
        updated_days[target_index].activities = new_activities

        # Recalculate deterministic budget in Python
        recalculated_budget = self.recalculate_budget(updated_days, currency)

        # Persist updated itinerary
        update_data = {
            **itin.model_dump(),
            "days": [d.model_dump() for d in updated_days],
            "budget": recalculated_budget.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        updated = await itinerary_repository.create(update_data)
        return updated

    async def patch_itinerary(self, itinerary_id: str, user_id: str, update_in: ItineraryUpdate) -> ItineraryResponse:
        existing = await self.get_itinerary(itinerary_id, user_id)

        # If days were modified, recalculate budget categories deterministically
        if update_in.days is not None:
            new_budget = self.recalculate_budget(update_in.days, existing.budget.currency)
            update_data = update_in.model_dump(exclude_unset=True)
            update_data["budget"] = new_budget.model_dump()
            updated = await itinerary_repository.create({**existing.model_dump(), **update_data})
            return updated

        updated = await itinerary_repository.update(itinerary_id, update_in)
        return updated or existing

    update_itinerary = patch_itinerary

    async def get_budget_analysis(self, itinerary_id: str, user_id: Optional[str] = None) -> BudgetBreakdownAnalysis:
        itin = await self.get_itinerary(itinerary_id, user_id)
        trip = await trip_repository.get_by_id(itin.trip_id)
        trip_budget = float(trip.budget) if trip else 0.0

        total_est = float(itin.budget.total_estimated)
        difference = round(total_est - trip_budget, 2)
        is_over = difference > 0

        return BudgetBreakdownAnalysis(
            itinerary_id=itinerary_id,
            trip_budget=trip_budget,
            total_estimated=total_est,
            currency=itin.budget.currency,
            is_over_budget=is_over,
            difference=abs(difference),
            categories=itin.budget.categories,
        )

    get_budget_breakdown = get_budget_analysis

    def recalculate_budget(self, days: List[DayPlan], currency: str = "INR") -> ItineraryBudget:
        cats = {
            "transport": 0.0,
            "accommodation": 0.0,
            "food": 0.0,
            "activities": 0.0,
            "miscellaneous": 0.0,
        }

        for d in days:
            for act in d.activities:
                cost = float(act.estimated_cost or 0.0)
                category = (act.category or "sightseeing").lower()
                name_lower = (act.name or "").lower()

                is_transport = (
                    "transport" in category or "transit" in category or "flight" in category or "train" in category or "bus" in category
                    or "flight" in name_lower or "train" in name_lower or "bus" in name_lower
                )

                if is_transport:
                    cats["transport"] += cost
                elif "hotel" in category or "accommodation" in category or "lodging" in category or "stay" in category or "resort" in category or "check-in" in name_lower:
                    cats["accommodation"] += cost
                elif "food" in category or "dining" in category or "meal" in category or "restaurant" in category or "dinner" in name_lower or "lunch" in name_lower or "breakfast" in name_lower:
                    cats["food"] += cost
                elif "sightseeing" in category or "cultural" in category or "activity" in category or "activities" in category or "monument" in name_lower or "temple" in name_lower or "museum" in name_lower:
                    cats["activities"] += cost
                else:
                    cats["miscellaneous"] += cost

                # Non-duplication rule:
                # If the activity is already an intercity flight/train/transit activity, do NOT add its transport leg cost again!
                # Only add transport leg if the activity is a destination/monument/stay with a separate transit commute to get there.
                if not is_transport and act.transport and act.transport.estimated_cost:
                    cats["transport"] += float(act.transport.estimated_cost)

        total = sum(cats.values())
        return ItineraryBudget(
            currency=currency,
            total_estimated=round(total, 2),
            categories=BudgetCategoryBreakdown(**{k: round(v, 2) for k, v in cats.items()}),
        )

    async def claim_guest_itinerary(self, itinerary_id: str, user_id: str) -> ItineraryResponse:
        """
        Associates a temporary guest itinerary with the authenticated user account:
        1. Retrieves the guest itinerary.
        2. Creates an owned trip in trip_repository for user_id.
        3. Updates the itinerary record with the new user_id and trip_id.
        4. Persists the itinerary in the database.
        """
        guest_itin = await itinerary_repository.get_by_id(itinerary_id)
        if not guest_itin:
            raise NotFoundException("Itinerary not found", code="ITINERARY_NOT_FOUND")

        # Prevent duplicate claiming
        if guest_itin.user_id == user_id:
            return guest_itin

        if guest_itin.user_id != GUEST_USER_ID:
            raise AppException(
                "This itinerary has already been claimed by another account",
                status_code=409,
                code="ALREADY_CLAIMED"
            )

        start_d = guest_itin.days[0].date if guest_itin.days else "2026-11-01"
        end_d = guest_itin.days[-1].date if guest_itin.days else "2026-11-03"
        dest = guest_itin.title.replace(" Itinerary", "").replace("3-Day ", "").replace("2-Day ", "").strip() or "Travel Trip"

        new_trip = TripCreate(
            destination=dest,
            start_date=date.fromisoformat(start_d),
            end_date=date.fromisoformat(end_d),
            budget=guest_itin.budget.total_estimated if guest_itin.budget else 20000.0,
            currency=guest_itin.budget.currency if guest_itin.budget else "INR",
            travellers=2,
            travel_style="balanced",
            interests=["heritage", "culture"],
            status="planned",
        )
        created_trip = await trip_repository.create(user_id, new_trip)

        # Update and persist itinerary for the authenticated user
        itin_dict = guest_itin.model_dump(mode="json")
        itin_dict["user_id"] = user_id
        itin_dict["trip_id"] = created_trip.id

        saved_itin = await itinerary_repository.create(itin_dict)
        return saved_itin


itinerary_service = ItineraryService()
