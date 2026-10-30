from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, model_validator, ConfigDict

ItineraryStatus = Literal["draft", "generated", "confirmed", "archived"]
SourceStatus = Literal["verified", "unverified", "not_applicable"]


class ActivityLocation(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    place_id: Optional[str] = None


class ActivityTransport(BaseModel):
    mode: Optional[str] = None
    details: Optional[str] = None
    duration_minutes: Optional[int] = None
    estimated_cost: Optional[float] = 0.0
    distance_meters: Optional[int] = None


class Activity(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="sightseeing", max_length=100)
    start_time: Optional[str] = Field(default="09:00", alias="startTime")
    duration_minutes: int = Field(default=60, ge=1, alias="durationMinutes")
    estimated_cost: float = Field(default=0.0, ge=0, alias="estimatedCost")
    cost_currency: str = Field(default="INR", min_length=3, max_length=3, alias="costCurrency")
    location: Optional[ActivityLocation] = Field(default_factory=ActivityLocation)
    transport: Optional[ActivityTransport] = Field(default_factory=ActivityTransport)
    source_status: SourceStatus = Field(default="unverified", alias="sourceStatus")


class DayPlan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    day_number: int = Field(ge=1, alias="dayNumber")
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    theme: Optional[str] = None
    activities: List[Activity] = Field(default_factory=list)


class BudgetCategoryBreakdown(BaseModel):
    transport: float = 0.0
    accommodation: float = 0.0
    food: float = 0.0
    activities: float = 0.0
    miscellaneous: float = 0.0


class ItineraryBudget(BaseModel):
    currency: str = "INR"
    total_estimated: float = 0.0
    categories: BudgetCategoryBreakdown = Field(default_factory=BudgetCategoryBreakdown)


class ItineraryUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    summary: Optional[str] = None
    status: Optional[ItineraryStatus] = None
    days: Optional[List[DayPlan]] = None


ItineraryPatchRequest = ItineraryUpdate


class ItineraryResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    title: str
    summary: Optional[str] = None
    status: ItineraryStatus = "generated"
    days: List[DayPlan] = Field(default_factory=list)
    budget: ItineraryBudget = Field(default_factory=ItineraryBudget)
    assumptions: List[str] = Field(default_factory=list)
    generation_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class BudgetBreakdownAnalysis(BaseModel):
    itinerary_id: str
    trip_budget: float
    total_estimated: float
    currency: str
    is_over_budget: bool
    difference: float
    categories: BudgetCategoryBreakdown


class GenerateItineraryRequest(BaseModel):
    trip_id: Optional[str] = Field(default=None, alias="tripId")
    preferences: Optional[Dict[str, Any]] = None
    regenerate: bool = False

    model_config = {
        "populate_by_name": True,
    }

    @model_validator(mode="after")
    def check_inputs(self):
        if not self.trip_id and not self.preferences:
            raise ValueError("Either trip_id or preferences must be provided")
        return self


class RegenerateDayRequest(BaseModel):
    instruction: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

