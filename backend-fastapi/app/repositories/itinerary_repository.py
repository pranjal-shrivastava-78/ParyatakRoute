import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.repositories.supabase_client import get_supabase_client
from app.schemas.itinerary import ItineraryResponse, ItineraryUpdate
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger

_memory_itineraries: Dict[str, Dict[str, Any]] = {}


class ItineraryRepository:
    def __init__(self):
        self.client = get_supabase_client()

    def _check_production_readiness(self):
        if settings.APP_ENV == "production" and not self.client:
            raise AppException(
                status_code=503,
                error_code="DATABASE_UNAVAILABLE",
                message="Persistent database storage is unavailable in production",
            )

    async def create(self, itinerary_dict: Dict[str, Any]) -> ItineraryResponse:
        self._check_production_readiness()
        itin_id = itinerary_dict.get("id") or str(uuid.uuid4())
        itinerary_dict["id"] = itin_id
        now = datetime.now(timezone.utc).isoformat()
        created_val = itinerary_dict.get("created_at")
        if isinstance(created_val, datetime):
            itinerary_dict["created_at"] = created_val.isoformat()
        else:
            itinerary_dict["created_at"] = created_val or now

        updated_val = itinerary_dict.get("updated_at")
        if isinstance(updated_val, datetime):
            itinerary_dict["updated_at"] = updated_val.isoformat()
        else:
            itinerary_dict["updated_at"] = now

        from app.core.security import GUEST_USER_ID
        if itinerary_dict.get("user_id") == GUEST_USER_ID:
            _memory_itineraries[itin_id] = itinerary_dict
            return ItineraryResponse(**itinerary_dict)

        if self.client:
            try:
                res = self.client.table("itineraries").insert(itinerary_dict).execute()
                if res.data and len(res.data) > 0:
                    return ItineraryResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[ItinRepo] Supabase insert error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[ItinRepo] Supabase insert error: {e}")

        _memory_itineraries[itin_id] = itinerary_dict
        return ItineraryResponse(**itinerary_dict)

    async def get_by_id(self, itin_id: str) -> Optional[ItineraryResponse]:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("itineraries").select("*").eq("id", itin_id).execute()
                if res.data and len(res.data) > 0:
                    return ItineraryResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[ItinRepo] Supabase get error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[ItinRepo] Supabase get error: {e}")

        if itin_id in _memory_itineraries:
            return ItineraryResponse(**_memory_itineraries[itin_id])
        return None

    async def list_by_trip(self, trip_id: str) -> List[ItineraryResponse]:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("itineraries").select("*").eq("trip_id", trip_id).order("created_at", desc=True).execute()
                return [ItineraryResponse(**item) for item in (res.data or [])]
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[ItinRepo] Supabase list error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[ItinRepo] Supabase list error: {e}")

        items = [i for i in _memory_itineraries.values() if i["trip_id"] == trip_id]
        items.sort(key=lambda x: x["created_at"], reverse=True)
        return [ItineraryResponse(**i) for i in items]

    async def update(self, itin_id: str, update_in: ItineraryUpdate) -> Optional[ItineraryResponse]:
        self._check_production_readiness()
        update_data = update_in.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(itin_id)

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self.client:
            try:
                res = self.client.table("itineraries").update(update_data).eq("id", itin_id).execute()
                if res.data and len(res.data) > 0:
                    return ItineraryResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[ItinRepo] Supabase update error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[ItinRepo] Supabase update error: {e}")

        if itin_id in _memory_itineraries:
            _memory_itineraries[itin_id].update(update_data)
            return ItineraryResponse(**_memory_itineraries[itin_id])
        return None

    async def delete_by_trip(self, trip_id: str) -> bool:
        self._check_production_readiness()
        if self.client:
            try:
                self.client.table("itineraries").delete().eq("trip_id", trip_id).execute()
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[ItinRepo] Supabase delete error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[ItinRepo] Supabase delete error: {e}")

        to_del = [k for k, v in _memory_itineraries.items() if v["trip_id"] == trip_id]
        for k in to_del:
            del _memory_itineraries[k]
        return True


itinerary_repository = ItineraryRepository()
