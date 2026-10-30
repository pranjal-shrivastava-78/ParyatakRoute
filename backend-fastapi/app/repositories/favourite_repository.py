import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.repositories.supabase_client import get_supabase_client
from app.schemas.favourite import FavouriteCreate, FavouriteResponse
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger

_memory_favourites: Dict[str, Dict[str, Any]] = {}


class FavouriteRepository:
    def __init__(self):
        self.client = get_supabase_client()

    def _check_production_readiness(self):
        if settings.APP_ENV == "production" and not self.client:
            raise AppException(
                status_code=503,
                error_code="DATABASE_UNAVAILABLE",
                message="Persistent database storage is unavailable in production",
            )

    async def create(self, user_id: str, fav_in: FavouriteCreate) -> FavouriteResponse:
        self._check_production_readiness()
        fav_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        record = fav_in.model_dump()
        record["id"] = fav_id
        record["user_id"] = user_id
        record["created_at"] = now
        record["updated_at"] = now

        # Duplicate check per user
        existing = await self.get_by_place_id(user_id, fav_in.place_id)
        if existing:
            raise AppException("Place is already saved in your favourites", code="FAVOURITE_ALREADY_EXISTS", status_code=409)

        if self.client:
            try:
                res = self.client.table("favourites").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return FavouriteResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[FavRepo] Supabase insert error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[FavRepo] Supabase insert error: {e}")

        _memory_favourites[fav_id] = record
        return FavouriteResponse(**record)

    async def get_by_id(self, fav_id: str) -> Optional[FavouriteResponse]:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("favourites").select("*").eq("id", fav_id).execute()
                if res.data and len(res.data) > 0:
                    return FavouriteResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[FavRepo] Supabase get error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[FavRepo] Supabase get error: {e}")

        if fav_id in _memory_favourites:
            return FavouriteResponse(**_memory_favourites[fav_id])
        return None

    async def get_by_place_id(self, user_id: str, place_id: str) -> Optional[FavouriteResponse]:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("favourites").select("*").eq("user_id", user_id).eq("place_id", place_id).execute()
                if res.data and len(res.data) > 0:
                    return FavouriteResponse(**res.data[0])
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[FavRepo] Supabase check error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[FavRepo] Supabase check error: {e}")

        for f in _memory_favourites.values():
            if f["user_id"] == user_id and f["place_id"] == place_id:
                return FavouriteResponse(**f)
        return None

    async def list_by_user(self, user_id: str) -> List[FavouriteResponse]:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("favourites").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
                return [FavouriteResponse(**item) for item in (res.data or [])]
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[FavRepo] Supabase list error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[FavRepo] Supabase list error: {e}")

        items = [f for f in _memory_favourites.values() if f["user_id"] == user_id]
        items.sort(key=lambda x: x["created_at"], reverse=True)
        return [FavouriteResponse(**f) for f in items]

    async def delete(self, fav_id: str) -> bool:
        self._check_production_readiness()
        if self.client:
            try:
                self.client.table("favourites").delete().eq("id", fav_id).execute()
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[FavRepo] Supabase delete error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[FavRepo] Supabase delete error: {e}")

        if fav_id in _memory_favourites:
            del _memory_favourites[fav_id]
            return True
        return True


favourite_repository = FavouriteRepository()
