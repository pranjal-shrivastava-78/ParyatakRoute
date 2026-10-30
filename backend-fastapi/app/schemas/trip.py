from datetime import date, datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator, ConfigDict, AliasChoices


TravelStyle = str
TripStatus = Literal["draft", "planned", "completed", "cancelled"]


class TripBase(BaseModel):
    destination: str = Field(min_length=2, max_length=200, description="Target city or region", examples=["Goa, India"])
    starting_city: Optional[str] = Field(default=None, max_length=200, validation_alias=AliasChoices("starting_city", "origin_city"), description="Origin city", examples=["Mumbai"])
    start_date: date = Field(..., description="Trip start date (YYYY-MM-DD)", examples=["2026-11-15"])
    end_date: date = Field(..., description="Trip end date (YYYY-MM-DD)", examples=["2026-11-20"])
    budget: float = Field(ge=0, description="Total estimated trip budget", examples=[35000.0])
    currency: str = Field(default="INR", min_length=3, max_length=3, description="3-letter currency code", examples=["INR"])
    travellers: int = Field(default=1, ge=1, le=50, alias="travelers_count", description="Number of travelers", examples=[2])
    travel_style: str = Field(default="balanced", description="Pacing / style (e.g., adventure, luxury, budget, balanced, cultural)", examples=["balanced"])
    interests: List[str] = Field(default_factory=list, description="List of traveler interest tags", examples=[["beaches", "seafood", "heritage"]])
    transport_preference: Optional[str] = Field(default=None, max_length=100, description="Preferred mode of travel", examples=["flight"])
    accommodation_preference: Optional[str] = Field(default=None, max_length=100, description="Accommodation category", examples=["beach resort"])
    dietary_preferences: Optional[str] = Field(default=None, max_length=200, description="Dietary restrictions or notes", examples=["pescatarian"])
    accessibility_preferences: Optional[str] = Field(default=None, max_length=200, description="Accessibility requirements", examples=["ground floor preferred"])
    additional_notes: Optional[str] = Field(default=None, description="Freeform traveler requests", examples=["Sunset cruise at Mandovi river."])
    status: TripStatus = Field(default="planned", description="Lifecycle status", examples=["planned"])

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "destination": "Goa, India",
                "starting_city": "Mumbai",
                "start_date": "2026-11-15",
                "end_date": "2026-11-20",
                "budget": 35000.0,
                "currency": "INR",
                "travelers_count": 2,
                "travel_style": "balanced",
                "interests": ["beaches", "seafood", "heritage", "water sports"],
                "transport_preference": "flight",
                "accommodation_preference": "beach resort",
                "dietary_preferences": "pescatarian",
                "accessibility_preferences": "ground floor preferred",
                "additional_notes": "Planning sunset cruise at Mandovi river and visiting Old Goa churches.",
                "status": "planned",
            }
        },
    )

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
    destination: Optional[str] = Field(default=None, min_length=2, max_length=200, description="Updated destination", examples=["North Goa, India"])
    starting_city: Optional[str] = Field(default=None, max_length=200, description="Updated starting city", examples=["Pune"])
    start_date: Optional[date] = Field(default=None, description="Updated start date", examples=["2026-11-16"])
    end_date: Optional[date] = Field(default=None, description="Updated end date", examples=["2026-11-21"])
    budget: Optional[float] = Field(default=None, ge=0, description="Updated budget", examples=[40000.0])
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3, description="Updated currency", examples=["INR"])
    travellers: Optional[int] = Field(default=None, ge=1, le=50, description="Updated traveler count", examples=[3])
    travel_style: Optional[TravelStyle] = Field(default=None, description="Updated travel style", examples=["adventure"])
    interests: Optional[List[str]] = Field(default=None, description="Updated interests", examples=[["scuba diving", "night markets"]])
    transport_preference: Optional[str] = Field(default=None, description="Updated transport preference")
    accommodation_preference: Optional[str] = Field(default=None, description="Updated accommodation preference")
    dietary_preferences: Optional[str] = Field(default=None, description="Updated dietary preferences")
    accessibility_preferences: Optional[str] = Field(default=None, description="Updated accessibility preferences")
    additional_notes: Optional[str] = Field(default=None, description="Updated notes", examples=["Added scuba diving package."])
    status: Optional[TripStatus] = Field(default=None, description="Updated status", examples=["planned"])

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "budget": 40000.0,
                "travel_style": "adventure",
                "interests": ["scuba diving", "beaches", "night markets"],
                "additional_notes": "Extended budget for watersports package.",
            }
        },
    )


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
