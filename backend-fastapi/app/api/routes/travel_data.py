"""Travel data API routes for ParyatakRoute.

Provides external API integrations with caching:
- Nominatim geocoding & place search
- OSRM route calculations
- Open-Meteo weather forecasts
- Exchange rate lookups and currency conversion
"""
from typing import Any
from fastapi import APIRouter, Query, status

from app.schemas.common import APIResponse
from app.schemas.travel_data import (
    NormalizedPlace,
    DirectionsRequest,
    DirectionsResponse,
    WeatherResponse,
    CurrencyRatesResponse,
    CurrencyConvertResponse,
)
from app.services.travel_data_service import TravelDataService

router = APIRouter(tags=["Travel Data"])
travel_service = TravelDataService()


@router.get("/destinations", response_model=APIResponse[list[NormalizedPlace]], status_code=status.HTTP_200_OK)
async def search_destinations(
    query: str = Query(..., min_length=2, description="Place or city name to search"),
    limit: int = Query(5, ge=1, le=20, description="Max results"),
) -> APIResponse[list[NormalizedPlace]]:
    """Search for destinations using OpenStreetMap Nominatim geocoding."""
    results = await travel_service.search_destinations(query=query, limit=limit)
    return APIResponse(success=True, data=results)


@router.post("/directions", response_model=APIResponse[DirectionsResponse], status_code=status.HTTP_200_OK)
async def get_directions(
    request: DirectionsRequest,
) -> APIResponse[DirectionsResponse]:
    """Calculate driving route between two points using OSRM routing."""
    directions = await travel_service.get_directions(request)
    return APIResponse(success=True, data=directions)


@router.get("/weather", response_model=APIResponse[WeatherResponse], status_code=status.HTTP_200_OK)
async def get_weather(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
) -> APIResponse[WeatherResponse]:
    """Get weather conditions and 7-day forecast using Open-Meteo."""
    weather = await travel_service.get_weather(latitude=lat, longitude=lon)
    return APIResponse(success=True, data=weather)


@router.get("/currency/rates", response_model=APIResponse[CurrencyRatesResponse], status_code=status.HTTP_200_OK)
async def get_currency_rates(
    base: str = Query("USD", min_length=3, max_length=3, description="Base 3-letter currency code"),
) -> APIResponse[CurrencyRatesResponse]:
    """Get latest exchange rates for supported currencies."""
    rates = await travel_service.get_currency_rates(base=base.upper())
    return APIResponse(success=True, data=rates)


@router.get("/currency/convert", response_model=APIResponse[CurrencyConvertResponse], status_code=status.HTTP_200_OK)
async def convert_currency(
    from_curr: str = Query(..., alias="from", min_length=3, max_length=3, description="From currency code"),
    to_curr: str = Query(..., alias="to", min_length=3, max_length=3, description="To currency code"),
    amount: float = Query(..., gt=0, description="Amount to convert"),
) -> APIResponse[CurrencyConvertResponse]:
    """Convert an amount from one currency to another."""
    converted = await travel_service.convert_currency(
        amount=amount,
        from_curr=from_curr.upper(),
        to_curr=to_curr.upper(),
    )
    return APIResponse(success=True, data=converted)
