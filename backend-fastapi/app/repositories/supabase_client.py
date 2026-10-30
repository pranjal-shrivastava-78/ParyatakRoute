from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Client.
    Safely uses SERVICE_ROLE_KEY for privileged backend operations,
    or PUBLISHABLE_KEY if service key is not yet set.

    In production mode, fails immediately if required credentials are missing
    or if client initialization fails.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_PUBLISHABLE_KEY
    if not settings.SUPABASE_URL or not key:
        if settings.APP_ENV == "production":
            logger.critical("[Supabase] Required Supabase credentials missing in production environment!")
            raise RuntimeError("CRITICAL: Supabase credentials missing in production environment")
        logger.warning("[Supabase] Credentials not configured. Operating in mock repository mode.")
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, key)
        return _supabase_client
    except Exception as e:
        if settings.APP_ENV == "production":
            logger.critical(f"[Supabase] Initialization failed in production: {e}")
            raise RuntimeError(f"CRITICAL: Supabase initialization failed in production: {e}")
        logger.error(f"[Supabase] Initialization error: {e}")
        return None
