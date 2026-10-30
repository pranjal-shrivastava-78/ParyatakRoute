"""Tests for Groq AI service resilience, token optimization, and error handling."""
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import pytest
from groq import RateLimitError, APIError, APIConnectionError
import httpx

from app.core.config import settings
from app.core.exceptions import AppException
from app.services.groq_service import GroqService


@pytest.mark.asyncio
async def test_groq_missing_api_key_raises_503():
    """Missing GROQ_API_KEY must raise 503 AI_NOT_CONFIGURED."""
    with patch.object(settings, "GROQ_API_KEY", ""):
        service = GroqService()
        with pytest.raises(AppException) as exc_info:
            service.get_client()
        assert exc_info.value.status_code == 503
        assert exc_info.value.code == "AI_NOT_CONFIGURED"


@pytest.mark.asyncio
async def test_groq_rate_limit_retry_and_exhaustion():
    """RateLimitError triggers exponential backoff retry and raises 429 when exhausted."""
    service = GroqService()
    service.max_retries = 2

    # Construct mock RateLimitError
    mock_request = httpx.Request("POST", "https://api.groq.com")
    mock_response = httpx.Response(429, request=mock_request)
    mock_fn = AsyncMock(side_effect=RateLimitError("Rate limit reached", response=mock_response, body=None))

    with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        with pytest.raises(AppException) as exc_info:
            await service._call_with_retry(mock_fn)

        assert exc_info.value.status_code == 429
        assert exc_info.value.code == "AI_RATE_LIMIT_EXCEEDED"
        assert mock_fn.call_count == 2
        assert mock_sleep.call_count == 1  # Retried once before raising


@pytest.mark.asyncio
async def test_groq_connection_timeout_raises_504():
    """Connection errors and timeouts raise 504 AI_PROVIDER_ERROR after retries."""
    service = GroqService()
    service.max_retries = 2

    mock_request = httpx.Request("POST", "https://api.groq.com")
    mock_fn = AsyncMock(side_effect=APIConnectionError(request=mock_request))

    with patch("asyncio.sleep", new_callable=AsyncMock):
        with pytest.raises(AppException) as exc_info:
            await service._call_with_retry(mock_fn)

        assert exc_info.value.status_code == 504
        assert exc_info.value.code == "AI_PROVIDER_ERROR"
        assert mock_fn.call_count == 2


def test_groq_clean_json_parser():
    """Parser strips markdown fences and handles pure or fenced JSON."""
    service = GroqService()

    # Clean JSON
    res1 = service._clean_json_response('{"title": "Test Plan"}')
    assert res1["title"] == "Test Plan"

    # Fenced JSON with ```json
    res2 = service._clean_json_response('```json\n{"title": "Fenced Plan"}\n```')
    assert res2["title"] == "Fenced Plan"

    # Malformed JSON raises 502
    with pytest.raises(AppException) as exc_info:
        service._clean_json_response("This is not JSON at all")
    assert exc_info.value.status_code == 502
    assert exc_info.value.code == "AI_MALFORMED_OUTPUT"


def test_deterministic_date_calculation_makes_no_ai_calls():
    """Date sequence calculations are 100% deterministic and make zero Groq calls."""
    service = GroqService()

    dates = service.calculate_expected_dates("2026-11-01", "2026-11-04")
    assert dates == ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"]
    assert len(dates) == 4

    # Invalid range raises 400
    with pytest.raises(AppException) as exc_info:
        service.calculate_expected_dates("2026-11-05", "2026-11-01")
    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "INVALID_DATE_RANGE"
