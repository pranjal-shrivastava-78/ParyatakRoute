"""Itineraries API routes for ParyatakRoute.

Provides itinerary generation via Groq AI, single-day surgical regeneration,
itinerary retrieval, patch edits with deterministic budget recalculation,
budget breakdown analytics, and ReportLab PDF export.
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, Path, Response, status

from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import APIResponse
from app.schemas.itinerary import (
    ItineraryResponse,
    ItineraryPatchRequest,
    BudgetBreakdownAnalysis,
    GenerateItineraryRequest,
    RegenerateDayRequest,
)
from app.services.itinerary_service import itinerary_service
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])
pdf_service = PDFService()


@router.post("/generate", response_model=APIResponse[ItineraryResponse], status_code=status.HTTP_201_CREATED, summary="Generate Travel Itinerary with Groq AI")
async def generate_itinerary(
    request: GenerateItineraryRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ItineraryResponse]:
    """Generate a structured personalized travel itinerary using Groq AI."""
    itinerary = await itinerary_service.generate_and_save_itinerary(current_user.id, request)
    return APIResponse(
        success=True,
        message="Itinerary generated and saved successfully",
        data=itinerary,
    )


@router.get("/trip/{trip_id}", response_model=APIResponse[ItineraryResponse], status_code=status.HTTP_200_OK, summary="Get Itinerary By Trip ID")
async def get_itinerary_by_trip(
    trip_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ItineraryResponse]:
    """Get the itinerary associated with a trip."""
    itinerary = await itinerary_service.get_itinerary_by_trip(trip_id, current_user.id)
    return APIResponse(success=True, data=itinerary)


@router.get("/{itinerary_id}", response_model=APIResponse[ItineraryResponse], status_code=status.HTTP_200_OK, summary="Get Itinerary By ID")
async def get_itinerary(
    itinerary_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ItineraryResponse]:
    """Get itinerary details by ID with ownership verification."""
    itinerary = await itinerary_service.get_itinerary(itinerary_id, current_user.id)
    return APIResponse(success=True, data=itinerary)


@router.patch("/{itinerary_id}", response_model=APIResponse[ItineraryResponse], status_code=status.HTTP_200_OK, summary="Patch Itinerary & Recalculate Budget")
async def patch_itinerary(
    itinerary_id: str,
    patch_data: ItineraryPatchRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ItineraryResponse]:
    """Update itinerary days/activities with automatic deterministic budget recalculation."""
    updated = await itinerary_service.patch_itinerary(itinerary_id, current_user.id, patch_data)
    return APIResponse(success=True, data=updated)


@router.get("/{itinerary_id}/budget", response_model=APIResponse[BudgetBreakdownAnalysis], status_code=status.HTTP_200_OK, summary="Get Itinerary Budget Analytics")
async def get_itinerary_budget_analysis(
    itinerary_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[BudgetBreakdownAnalysis]:
    """Get comprehensive deterministic budget analytics and category breakdown."""
    analysis = await itinerary_service.get_budget_analysis(itinerary_id, current_user.id)
    return APIResponse(success=True, data=analysis)


@router.post(
    "/{itinerary_id}/days/{day_number}/regenerate",
    response_model=APIResponse[ItineraryResponse],
    status_code=status.HTTP_200_OK,
    summary="Surgically Regenerate Single Day Plan",
)
async def regenerate_day(
    itinerary_id: str = Path(...),
    day_number: int = Path(..., ge=1),
    request: Optional[RegenerateDayRequest] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ItineraryResponse]:
    """Surgically regenerate a single day's plan via Groq AI without modifying other days."""
    instruction = request.instruction if request else None
    updated = await itinerary_service.regenerate_day_and_save(
        itinerary_id=itinerary_id,
        day_number=day_number,
        user_id=current_user.id,
        instruction=instruction,
    )
    return APIResponse(
        success=True,
        message=f"Day {day_number} regenerated successfully",
        data=updated,
    )


@router.get("/{itinerary_id}/export/pdf", summary="Export Itinerary as PDF Document")
async def export_itinerary_pdf(
    itinerary_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    """Generate and download a high quality PDF export of the itinerary."""
    itinerary = await itinerary_service.get_itinerary(itinerary_id, current_user.id)
    pdf_bytes = pdf_service.generate_itinerary_pdf(itinerary)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="paryatakroute-itinerary-{itinerary_id}.pdf"',
            "Content-Type": "application/pdf",
        },
    )
