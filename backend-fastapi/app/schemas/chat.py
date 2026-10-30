"""Chat request and response schemas for ParyatakRoute Travel Assistant."""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator

ChatRole = Literal["user", "assistant", "system"]


class ChatMessage(BaseModel):
    role: ChatRole
    content: str = Field(min_length=1, max_length=2000, description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000, description="User prompt or query")
    trip_id: Optional[str] = Field(default=None, alias="tripId", description="Optional trip ID for context")
    itinerary_id: Optional[str] = Field(default=None, alias="itineraryId", description="Optional itinerary ID for context")
    history: List[ChatMessage] = Field(default_factory=list, max_length=20, description="Recent conversation turns")

    model_config = {
        "populate_by_name": True,
    }


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
