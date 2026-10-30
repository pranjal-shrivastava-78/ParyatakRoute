from typing import List
from app.repositories.favourite_repository import favourite_repository
from app.schemas.favourite import FavouriteCreate, FavouriteResponse, FavouriteListResponse
from app.core.exceptions import NotFoundException, ForbiddenException


class FavouriteService:
    async def add_favourite(self, user_id: str, fav_in: FavouriteCreate) -> FavouriteResponse:
        return await favourite_repository.create(user_id, fav_in)

    async def list_user_favourites(self, user_id: str, page: int = 1, limit: int = 20) -> FavouriteListResponse:
        items = await favourite_repository.list_by_user(user_id)
        start = (page - 1) * limit
        end = start + limit
        paginated = items[start:end]
        return FavouriteListResponse(
            items=paginated,
            total=len(items),
            page=page,
            limit=limit,
        )

    list_favourites = list_user_favourites

    async def remove_favourite(self, user_id: str, fav_id: str) -> bool:
        fav = await favourite_repository.get_by_id(fav_id)
        if not fav:
            raise NotFoundException("Favourite not found", code="FAVOURITE_NOT_FOUND")
        if fav.user_id != user_id:
            raise ForbiddenException("You do not have permission to delete this favourite", code="FORBIDDEN")
        return await favourite_repository.delete(fav_id)

    async def delete_favourite(self, fav_id: str, user_id: str) -> bool:
        return await self.remove_favourite(user_id, fav_id)


favourite_service = FavouriteService()
