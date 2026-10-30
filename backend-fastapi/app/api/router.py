"""Central API router configuration for ParyatakRoute.

Aggregates all route modules under the standardized /api/v1 namespace prefix.
"""
from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.trips import router as trips_router
from app.api.routes.itineraries import router as itineraries_router
from app.api.routes.favourites import router as favourites_router
from app.api.routes.chat import router as chat_router
from app.api.routes.travel_data import router as travel_data_router

api_v1_router = APIRouter(prefix="/api/v1")

# Mount all endpoint routers
api_v1_router.include_router(health_router, prefix="/health", tags=["Health"])
api_v1_router.include_router(auth_router)
api_v1_router.include_router(trips_router)
api_v1_router.include_router(itineraries_router)
api_v1_router.include_router(favourites_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(travel_data_router)
