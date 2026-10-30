import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from app.repositories.supabase_client import get_supabase_client
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger

# In-memory test store used for unit tests or when Supabase client is not configured
_memory_trips: Dict[str, Dict[str, Any]] = {}


class TripRepository:
    def __init__(self):
        self.client = get_supabase_client()

    def _check_production_readiness(self):
        if settings.APP_ENV == "production" and not self.client:
            raise AppException(
                status_code=503,
                error_code="DATABASE_UNAVAILABLE",
                message="Persistent database storage is unavailable in production",
            )

    async def create(self, user_id: str, trip_in: TripCreate) -> TripResponse:
        self._check_production_readiness()
        trip_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        duration_days = (trip_in.end_date - trip_in.start_date).days + 1

        record = {
            "id": trip_id,
            "user_id": user_id,
            "destination": trip_in.destination,
            "starting_city": trip_in.starting_city,
            "start_date": trip_in.start_date.isoformat(),
            "end_date": trip_in.end_date.isoformat(),
            "duration_days": duration_days,
            "budget": trip_in.budget,
            "currency": trip_in.currency,
            "travellers": trip_in.travellers,
            "travel_style": trip_in.travel_style,
            "interests": trip_in.interests,
            "transport_preference": trip_in.transport_preference,
            "accommodation_preference": trip_in.accommodation_preference,
            "dietary_preferences": trip_in.dietary_preferences,
            "accessibility_preferences": trip_in.accessibility_preferences,
            "additional_notes": trip_in.additional_notes,
            "status": trip_in.status,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        from app.core.security import GUEST_USER_ID
        if user_id == GUEST_USER_ID:
            _memory_trips[trip_id] = record
            return TripResponse(**record)

        if self.client:
            try:
                res = self.client.table("trips").insert(record).execute()
                if res.data and len(res.data) > 0:
                    data = res.data[0]
                    return TripResponse(**data)
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[TripRepo] Supabase insert error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[TripRepo] Supabase insert error: {e}. Falling back to memory store.")

        _memory_trips[trip_id] = record
        return TripResponse(**record)

    async def get_by_id(self, trip_id: str) -> Optional[TripResponse]:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("trips").select("*").eq("id", trip_id).execute()
                if res.data and len(res.data) > 0:
                    return TripResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[TripRepo] Supabase get error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[TripRepo] Supabase get error: {e}")

        if trip_id in _memory_trips:
            return TripResponse(**_memory_trips[trip_id])
        return None

    async def list_by_user(self, user_id: str, page: int = 1, limit: int = 10) -> Tuple[List[TripResponse], int]:
        self._check_production_readiness()
        offset = (page - 1) * limit

        if self.client:
            try:
                count_res = self.client.table("trips").select("id", count="exact").eq("user_id", user_id).execute()
                total = count_res.count or 0
                res = self.client.table("trips").select("*").eq("user_id", user_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                trips = [TripResponse(**t) for t in (res.data or [])]
                return trips, total
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[TripRepo] Supabase list error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[TripRepo] Supabase list error: {e}")

        user_records = [t for t in _memory_trips.values() if t["user_id"] == user_id]
        user_records.sort(key=lambda x: x["created_at"], reverse=True)
        total = len(user_records)
        paged = user_records[offset: offset + limit]
        return [TripResponse(**t) for t in paged], total

    async def update(self, trip_id: str, trip_update: TripUpdate) -> Optional[TripResponse]:
        self._check_production_readiness()
        update_data = trip_update.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(trip_id)

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self.client:
            try:
                res = self.client.table("trips").update(update_data).eq("id", trip_id).execute()
                if res.data and len(res.data) > 0:
                    return TripResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[TripRepo] Supabase update error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[TripRepo] Supabase update error: {e}")

        if trip_id in _memory_trips:
            _memory_trips[trip_id].update(update_data)
            return TripResponse(**_memory_trips[trip_id])
        return None

    async def delete(self, trip_id: str) -> bool:
        self._check_production_readiness()
        if self.client:
            try:
                self.client.table("trips").delete().eq("id", trip_id).execute()
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[TripRepo] Supabase delete error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[TripRepo] Supabase delete error: {e}")

        if trip_id in _memory_trips:
            del _memory_trips[trip_id]
            return True
        return True


trip_repository = TripRepository()
