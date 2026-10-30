from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.repositories.supabase_client import get_supabase_client
from app.schemas.common import APIResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("", response_model=APIResponse[dict], summary="Liveness Health Check")
@router.get("/", response_model=APIResponse[dict], include_in_schema=False)
async def health_check():
    """Liveness probe reporting that the ParyatakRoute backend server process is operational."""
    return APIResponse(
        success=True,
        data={"status": "ok"},
    )


@router.get("/ready", summary="Readiness & Database Probe")
async def readiness_check():
    """Readiness probe checking server uptime and Supabase PostgreSQL database connectivity."""
    client = get_supabase_client()
    if settings.APP_ENV == "production" and client is None:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "status": "unavailable",
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": "Database connection is not ready",
                },
            },
        )

    db_status = "connected" if client is not None else "mock_ready"
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "status": "ready",
            "database": db_status,
            "data": {
                "status": "ready",
                "database": db_status,
            },
        },
    )
