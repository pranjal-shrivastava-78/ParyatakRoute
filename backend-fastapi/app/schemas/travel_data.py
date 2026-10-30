from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class NormalizedPlace(BaseModel):
    place_id: str
    name: str
    display_name: str
    latitude: float
    longitude: float
    category: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    attribution: Optional[str] = None


class Coordinate(BaseModel):
    latitude: float
    longitude: float


class DirectionsRequest(BaseModel):
    coordinates: Optional[List[List[float]]] = Field(
        default=None,
        description="List of [longitude, latitude] coordinate pairs",
    )
    start: Optional[Coordinate] = None
    destination: Optional[Coordinate] = None
    mode: Optional[str] = "driving"

    @model_validator(mode="after")
    def populate_coordinates(self):
        if not self.coordinates:
            if self.start and self.destination:
                self.coordinates = [
                    [self.start.longitude, self.start.latitude],
                    [self.destination.longitude, self.destination.latitude],
                ]
            else:
                raise ValueError("Must provide either coordinates or start and destination")
        return self


class DirectionsResponse(BaseModel):
    distance_meters: float
    duration_seconds: float
    distance_km: float
    duration_minutes: float
    geometry: Optional[str] = None
    provider: str = "Project OSRM"


class WeatherDailyForecast(BaseModel):
    date: str
    max_temp_c: float
    min_temp_c: float
    weather_code: int
    condition: str
    precipitation_prob: Optional[int] = 0


class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    forecast_days: List[WeatherDailyForecast]
    current: Optional[Dict[str, Any]] = None
    provider: str = "Open-Meteo"

    @model_validator(mode="after")
    def populate_current(self):
        if not self.current and self.forecast_days:
            first = self.forecast_days[0]
            self.current = {
                "temperature": first.max_temp_c,
                "condition": first.condition,
                "precipitation_prob": first.precipitation_prob,
            }
        return self


class CurrencyConvertResponse(BaseModel):
    from_currency: str
    to_currency: str
    amount: float
    converted_amount: float
    rate: float
    result: Optional[float] = None
    provider: str = "ExchangeRate-API"

    model_config = {
        "populate_by_name": True,
        "extra": "allow",
    }

    @model_validator(mode="after")
    def populate_result(self):
        if self.result is None:
            self.result = self.converted_amount
        self.__dict__["from"] = self.from_currency
        self.__dict__["to"] = self.to_currency
        return self


class CurrencyRatesResponse(BaseModel):
    base: str
    date: str
    rates: Dict[str, float]
    provider: str = "ExchangeRate-API"
