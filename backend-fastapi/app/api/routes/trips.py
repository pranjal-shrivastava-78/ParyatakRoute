"""Trips API routes for ParyatakRoute.

Provides full CRUD operations with strict BOLA (Broken Object Level Authorization)
checks ensuring users can only read, update, or delete their own trips.
"""
from typing import Any
from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import APIResponse
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripListResponse
from app.services.trip_service import TripService

router = APIRouter(prefix="/trips", tags=["Trips"])
trip_service = TripService()


@router.post("", response_model=APIResponse[TripResponse], status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[TripResponse]:
    """Create a new trip for the authenticated user."""
    created = await trip_service.create_trip(current_user.id, trip_data)
    return APIResponse(success=True, data=created)


@router.get("", response_model=APIResponse[TripListResponse], status_code=status.HTTP_200_OK)
async def list_trips(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[TripListResponse]:
    """List paginated trips owned by the authenticated user."""
    results = await trip_service.list_user_trips(current_user.id, page=page, limit=limit)
    return APIResponse(success=True, data=results)


@router.get("/{trip_id}", response_model=APIResponse[TripResponse], status_code=status.HTTP_200_OK)
async def get_trip(
    trip_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[TripResponse]:
    """Get trip details by ID with ownership check."""
    trip = await trip_service.get_trip(trip_id, current_user.id)
    return APIResponse(success=True, data=trip)


@router.put("/{trip_id}", response_model=APIResponse[TripResponse], status_code=status.HTTP_200_OK)
async def update_trip(
    trip_id: str,
    updates: TripUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[TripResponse]:
    """Update trip details by ID with ownership check."""
    updated = await trip_service.update_trip(trip_id, current_user.id, updates)
    return APIResponse(success=True, data=updated)


@router.delete("/{trip_id}", response_model=APIResponse[dict[str, Any]], status_code=status.HTTP_200_OK)
async def delete_trip(
    trip_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[dict[str, Any]]:
    """Delete trip and cascaded itineraries with ownership check."""
    deleted = await trip_service.delete_trip(trip_id, current_user.id)
    return APIResponse(success=True, data={"id": trip_id, "deleted": deleted})
