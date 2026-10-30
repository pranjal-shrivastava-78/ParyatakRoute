from datetime import date, datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator


TravelStyle = str
TripStatus = Literal["draft", "planned", "completed", "cancelled"]


class TripBase(BaseModel):
    destination: str = Field(min_length=2, max_length=200, description="Target city or region")
    starting_city: Optional[str] = Field(default=None, max_length=200)
    start_date: date
    end_date: date
    budget: float = Field(ge=0, description="Total estimated budget")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    travellers: int = Field(default=1, ge=1, le=50, alias="travelers_count")
    travel_style: str = Field(default="balanced")
    interests: List[str] = Field(default_factory=list)
    transport_preference: Optional[str] = Field(default=None, max_length=100)
    accommodation_preference: Optional[str] = Field(default=None, max_length=100)
    dietary_preferences: Optional[str] = Field(default=None, max_length=200)
    accessibility_preferences: Optional[str] = Field(default=None, max_length=200)
    additional_notes: Optional[str] = None
    status: TripStatus = Field(default="planned")

    model_config = {
        "populate_by_name": True,
    }

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start_date")
        days = (self.end_date - self.start_date).days + 1
        if days < 1 or days > 60:
            raise ValueError("Trip duration must be between 1 and 60 days")
        return self


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    destination: Optional[str] = Field(default=None, min_length=2, max_length=200)
    starting_city: Optional[str] = Field(default=None, max_length=200)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    travellers: Optional[int] = Field(default=None, ge=1, le=50)
    travel_style: Optional[TravelStyle] = None
    interests: Optional[List[str]] = None
    transport_preference: Optional[str] = None
    accommodation_preference: Optional[str] = None
    dietary_preferences: Optional[str] = None
    accessibility_preferences: Optional[str] = None
    additional_notes: Optional[str] = None
    status: Optional[TripStatus] = None


class TripResponse(TripBase):
    id: str
    user_id: str
    duration_days: int
    created_at: datetime
    updated_at: datetime


class TripListResponse(BaseModel):
    trips: List[TripResponse]
    items: Optional[List[TripResponse]] = None
    total: int
    page: int
    limit: int
    total_pages: int

    @model_validator(mode="after")
    def sync_items(self):
        if self.items is None:
            self.items = self.trips
        return self
