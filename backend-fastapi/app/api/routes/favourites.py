"""Favourites API routes for ParyatakRoute.

Provides bookmark management for saved itineraries and destinations.
"""
from typing import Any
from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import APIResponse
from app.schemas.favourite import (
    FavouriteCreate,
    FavouriteResponse,
    FavouriteListResponse,
)
from app.services.favourite_service import FavouriteService

router = APIRouter(prefix="/favourites", tags=["Favourites"])
favourite_service = FavouriteService()


@router.post("", response_model=APIResponse[FavouriteResponse], status_code=status.HTTP_201_CREATED, summary="Bookmark Destination as Favourite")
async def add_favourite(
    favourite_data: FavouriteCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[FavouriteResponse]:
    """Add a new favourite for the authenticated user."""
    result = await favourite_service.add_favourite(current_user.id, favourite_data)
    return APIResponse(success=True, data=result)


@router.get("", response_model=APIResponse[FavouriteListResponse], status_code=status.HTTP_200_OK, summary="List User Saved Favourites")
async def list_favourites(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[FavouriteListResponse]:
    """List all saved favourites for the authenticated user."""
    results = await favourite_service.list_user_favourites(current_user.id, page=page, limit=limit)
    return APIResponse(success=True, data=results)


@router.delete("/{favourite_id}", response_model=APIResponse[dict[str, Any]], status_code=status.HTTP_200_OK, summary="Delete Saved Favourite")
async def remove_favourite(
    favourite_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[dict[str, Any]]:
    """Remove a saved favourite with ownership verification."""
    deleted = await favourite_service.delete_favourite(favourite_id, current_user.id)
    return APIResponse(success=True, data={"id": favourite_id, "deleted": deleted})
