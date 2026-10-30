from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.repositories.supabase_client import get_supabase_client
from app.schemas.auth import UserProfileResponse
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger

_memory_profiles: Dict[str, Dict[str, Any]] = {}


class ProfileRepository:
    def __init__(self):
        self.client = get_supabase_client()

    def _check_production_readiness(self):
        if settings.APP_ENV == "production" and not self.client:
            raise AppException(
                status_code=503,
                error_code="DATABASE_UNAVAILABLE",
                message="Persistent database storage is unavailable in production",
            )

    async def get_by_id(self, user_id: str, email: Optional[str] = None) -> UserProfileResponse:
        self._check_production_readiness()
        if self.client:
            try:
                res = self.client.table("profiles").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    d = res.data[0]
                    d["email"] = email or d.get("email")
                    return UserProfileResponse(**d)
            except Exception as e:
                if settings.APP_ENV == "production":
                    logger.critical(f"[ProfileRepo] Supabase get error in production: {e}")
                    raise AppException(
                        status_code=503,
                        error_code="DATABASE_UNAVAILABLE",
                        message="Database operation failed in production",
                    )
                logger.error(f"[ProfileRepo] Supabase get error: {e}")

        if user_id in _memory_profiles:
            d = _memory_profiles[user_id]
            d["email"] = email or d.get("email")
            return UserProfileResponse(**d)

        # Default fallback profile
        now = datetime.now(timezone.utc)
        record = {
            "id": user_id,
            "email": email or f"user_{user_id[:8]}@example.com",
            "name": email.split("@")[0] if email else "Traveler",
            "role": "user",
            "status": "active",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        _memory_profiles[user_id] = record
        return UserProfileResponse(**record)

    async def update(self, user_id: str, updates: Dict[str, Any]) -> UserProfileResponse:
        self._check_production_readiness()
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now

        if self.client:
            try:
                res = self.client.table("profiles").update(updates).eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    return UserProfileResponse(**res.data[0])
            except Exception as e:
                logger.warning(f"[ProfileRepo] Supabase update profile error: {e}")

        if user_id in _memory_profiles:
            _memory_profiles[user_id].update(updates)
            return UserProfileResponse(**_memory_profiles[user_id])

        record = {
            "id": user_id,
            "email": f"user_{user_id[:8]}@example.com",
            "name": updates.get("name", "Traveler"),
            "role": "user",
            "status": "active",
            "created_at": now,
            "updated_at": now,
            **updates,
        }
        _memory_profiles[user_id] = record
        return UserProfileResponse(**record)


profile_repository = ProfileRepository()
