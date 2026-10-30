from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FavouriteCreate(BaseModel):
    place_id: str = Field(min_length=1, max_length=150, description="Unique place identifier from OSM or provider", examples=["osm_rel_1942586"])
    name: str = Field(min_length=1, max_length=200, description="Destination or attraction name", examples=["Thiksey Monastery"])
    display_name: Optional[str] = Field(default=None, max_length=500, description="Full formatted address string", examples=["Thiksey Gompa, Leh district, Ladakh, India"])
    address: Optional[str] = Field(default=None, max_length=500, description="Short address", examples=["Leh-Manali Highway, Thiksey, Ladakh"])
    latitude: float = Field(ge=-90, le=90, description="WGS84 latitude coordinate", examples=[34.0583])
    longitude: float = Field(ge=-180, le=180, description="WGS84 longitude coordinate", examples=[77.6667])
    category: Optional[str] = Field(default=None, max_length=100, description="Place category tag", examples=["tourism"])
    type: Optional[str] = Field(default=None, max_length=100, description="Place subtype", examples=["monastery"])
    photo_url: Optional[str] = Field(default=None, description="External photo URL", examples=["https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5"])
    provider: str = Field(default="nominatim", max_length=50, description="Geocoding data provider", examples=["nominatim"])
    attribution: Optional[str] = Field(default=None, description="Data copyright attribution", examples=["© OpenStreetMap contributors"])
    notes: Optional[str] = Field(default=None, description="Personal traveler bookmark notes", examples=["Houses 15m Maitreya Buddha statue."])

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "place_id": "osm_rel_1942586",
                "name": "Thiksey Monastery",
                "display_name": "Thiksey Gompa, Leh district, Ladakh, 194201, India",
                "address": "Leh-Manali Highway, Thiksey, Ladakh",
                "latitude": 34.0583,
                "longitude": 77.6667,
                "category": "tourism",
                "type": "monastery",
                "photo_url": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5",
                "provider": "nominatim",
                "attribution": "© OpenStreetMap contributors",
                "notes": "Houses the iconic 15-meter tall Maitreya Buddha statue.",
            }
        },
    )


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

