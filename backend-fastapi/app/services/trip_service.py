import math
from typing import Optional
from app.repositories.trip_repository import trip_repository
from app.repositories.itinerary_repository import itinerary_repository
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripListResponse
from app.core.exceptions import NotFoundException, ForbiddenException


class TripService:
    async def create_trip(self, user_id: str, trip_in: TripCreate) -> TripResponse:
        return await trip_repository.create(user_id, trip_in)

    async def get_trip(self, trip_id: str, user_id: str) -> TripResponse:
        trip = await trip_repository.get_by_id(trip_id)
        if not trip:
            raise NotFoundException("Trip not found", code="TRIP_NOT_FOUND")
        if trip.user_id != user_id:
            raise ForbiddenException("You do not have permission to view this trip", code="FORBIDDEN")
        return trip

    async def list_trips(self, user_id: str, page: int = 1, limit: int = 20) -> TripListResponse:
        trips, total = await trip_repository.list_by_user(user_id, page, limit)
        total_pages = math.ceil(total / limit) if total > 0 else 1
        return TripListResponse(
            trips=trips,
            items=trips,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    # Alias for router consistency
    list_user_trips = list_trips

    async def update_trip(self, trip_id: str, user_id: str, trip_update: TripUpdate) -> TripResponse:
        existing = await self.get_trip(trip_id, user_id)
        updated = await trip_repository.update(trip_id, trip_update)
        return updated or existing

    async def delete_trip(self, trip_id: str, user_id: str) -> bool:
        await self.get_trip(trip_id, user_id)
        # Cascade delete child itineraries
        await itinerary_repository.delete_by_trip(trip_id)
        return await trip_repository.delete(trip_id)


trip_service = TripService()
