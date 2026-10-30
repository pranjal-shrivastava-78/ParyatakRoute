from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FavouriteCreate(BaseModel):
    place_id: str = Field(min_length=1, max_length=150)
    name: str = Field(min_length=1, max_length=200)
    display_name: Optional[str] = Field(default=None, max_length=500)
    address: Optional[str] = Field(default=None, max_length=500)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    category: Optional[str] = Field(default=None, max_length=100)
    type: Optional[str] = Field(default=None, max_length=100)
    photo_url: Optional[str] = None
    provider: str = Field(default="nominatim", max_length=50)
    attribution: Optional[str] = None
    notes: Optional[str] = None


class FavouriteResponse(FavouriteCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class FavouriteListResponse(BaseModel):
    items: list[FavouriteResponse]
    total: int
    page: int
    limit: int

