"""Chat request and response schemas for ParyatakRoute Travel Assistant."""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator, ConfigDict

ChatRole = Literal["user", "assistant", "system"]


class ChatMessage(BaseModel):
    role: ChatRole = Field(..., description="Message role (user, assistant, or system)", examples=["user"])
    content: str = Field(min_length=1, max_length=2000, description="Message text", examples=["What are the best local vegetarian dishes to try in Jaipur?"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000, description="User prompt or travel query", examples=["What should we wear when visiting Pangong Lake in October?"])
    trip_id: Optional[str] = Field(default=None, alias="tripId", description="Optional trip ID to supply journey context", examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"])
    itinerary_id: Optional[str] = Field(default=None, alias="itineraryId", description="Optional itinerary ID for day-by-day context", examples=["7ca85f64-1234-5678-b3fc-2c963f66afa6"])
    history: List[ChatMessage] = Field(default_factory=list, max_length=20, description="Recent conversation history turns")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "message": "What should we wear when visiting Pangong Lake in October?",
                "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "itinerary_id": "7ca85f64-1234-5678-b3fc-2c963f66afa6",
                "history": [
                    {"role": "user", "content": "We arrive in Leh on Day 1."},
                    {"role": "assistant", "content": "Make sure to dedicate Day 1 to complete rest and acclimatization to the 3,500m altitude."},
                ],
            }
        },
    )


class ChatResponse(BaseModel):
    reply: str
    trip_context_applied: bool = False
    tripContextApplied: Optional[bool] = None
    itinerary_context_applied: bool = False
    itineraryContextApplied: Optional[bool] = None
    timestamp: str

    model_config = {
        "populate_by_name": True,
    }

    @model_validator(mode="after")
    def sync_aliases(self):
        if self.tripContextApplied is None:
            self.tripContextApplied = self.trip_context_applied
        else:
            self.trip_context_applied = self.tripContextApplied

        if self.itineraryContextApplied is None:
            self.itineraryContextApplied = self.itinerary_context_applied
        else:
            self.itinerary_context_applied = self.itineraryContextApplied

        return self
