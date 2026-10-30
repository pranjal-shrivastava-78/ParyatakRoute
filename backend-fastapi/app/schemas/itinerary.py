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
    title: Optional[str] = Field(default=None, max_length=200, description="Updated itinerary title", examples=["5-Day Ladakh Cultural Experience"])
    summary: Optional[str] = Field(default=None, description="Updated trip summary")
    status: Optional[ItineraryStatus] = Field(default=None, description="Itinerary lifecycle status", examples=["confirmed"])
    days: Optional[List[DayPlan]] = Field(default=None, description="Updated day plans with activities")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "title": "Updated 5-Day Himalayan Monastery Tour",
                "summary": "Customized cultural itinerary across Leh, Nubra Valley, and Pangong Tso with adjusted activities.",
                "status": "confirmed",
            }
        },
    )


ItineraryPatchRequest = ItineraryUpdate


class ItineraryResponse(BaseModel):
    id: str = Field(..., description="Itinerary UUID")
    trip_id: str = Field(..., description="Associated Trip UUID")
    user_id: str = Field(..., description="Owner User UUID")
    title: str = Field(..., description="Itinerary Title")
    summary: Optional[str] = Field(default=None, description="AI-generated summary")
    status: ItineraryStatus = Field(default="generated", description="Current status")
    days: List[DayPlan] = Field(default_factory=list, description="Day-by-day scheduled activities")
    budget: ItineraryBudget = Field(default_factory=ItineraryBudget, description="Calculated budget breakdown")
    assumptions: List[str] = Field(default_factory=list, description="Travel constraints or season assumptions")
    generation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Groq AI model & tokens metadata")
    created_at: datetime
    updated_at: datetime


class BudgetBreakdownAnalysis(BaseModel):
    itinerary_id: str = Field(..., description="Itinerary UUID")
    trip_budget: float = Field(..., description="Trip target budget")
    total_estimated: float = Field(..., description="Total estimated cost across all days")
    currency: str = Field(..., description="Currency code (e.g., INR)")
    is_over_budget: bool = Field(..., description="Whether estimated total exceeds target budget")
    difference: float = Field(..., description="Absolute variance between estimated and target budget")
    categories: BudgetCategoryBreakdown = Field(..., description="Deterministic category totals")


class GenerateItineraryRequest(BaseModel):
    trip_id: Optional[str] = Field(default=None, alias="tripId", description="UUID of existing Trip to base generation on", examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"])
    preferences: Optional[Dict[str, Any]] = Field(default=None, description="Optional ad-hoc preferences overrides")
    regenerate: bool = Field(default=False, description="Whether to overwrite existing generated itinerary")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "regenerate": False,
                "preferences": {
                    "pacing": "moderate",
                    "mustInclude": ["Thiksey Monastery", "Pangong Lake"],
                },
            }
        },
    )

    @model_validator(mode="after")
    def check_inputs(self):
        if not self.trip_id and not self.preferences:
            raise ValueError("Either trip_id or preferences must be provided")
        return self


class RegenerateDayRequest(BaseModel):
    instruction: Optional[str] = Field(
        default=None,
        description="Surgical prompt instructing Groq AI how to replan this specific day",
        examples=["Swap outdoor high-altitude trekking for Tibetan art museums, tea houses, and craft workshops due to rain."],
    )
    preferences: Optional[Dict[str, Any]] = Field(default=None, description="Optional ad-hoc day preference overrides")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "instruction": "Swap outdoor hiking for indoor Tibetan art museums, handicraft markets, and local cafe visits.",
                "preferences": {
                    "pacing": "relaxed",
                },
            }
        },
    )

