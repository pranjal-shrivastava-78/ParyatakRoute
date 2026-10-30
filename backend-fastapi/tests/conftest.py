"""Pytest fixtures and test helpers for ParyatakRoute backend test suite."""
import time
from typing import Generator
import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

USER_A_ID = "00000000-0000-0000-0000-000000000001"
USER_B_ID = "00000000-0000-0000-0000-000000000002"
USER_A_EMAIL = "traveler.a@paryatakroute.test"
USER_B_EMAIL = "traveler.b@paryatakroute.test"


def create_mock_jwt(user_id: str, email: str, expires_in: int = 3600) -> str:
    """Generate a test Supabase HS256 JWT."""
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in,
        "user_metadata": {
            "name": email.split("@")[0],
        },
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


@pytest.fixture(autouse=True)
def isolated_mock_repositories():
    """Ensure automated unit test suite operates on clean in-memory repositories."""
    from app.repositories.trip_repository import trip_repository
    from app.repositories.itinerary_repository import itinerary_repository
    from app.repositories.favourite_repository import favourite_repository
    from app.repositories.profile_repository import profile_repository

    old_trip_c = trip_repository.client
    old_itin_c = itinerary_repository.client
    old_fav_c = favourite_repository.client
    old_prof_c = profile_repository.client

    trip_repository.client = None
    itinerary_repository.client = None
    favourite_repository.client = None
    profile_repository.client = None

    yield

    trip_repository.client = old_trip_c
    itinerary_repository.client = old_itin_c
    favourite_repository.client = old_fav_c
    profile_repository.client = old_prof_c


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """TestClient instance for API integration testing."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers_user_a() -> dict[str, str]:
    """Headers for authenticated User A."""
    token = create_mock_jwt(USER_A_ID, USER_A_EMAIL)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_b() -> dict[str, str]:
    """Headers for authenticated User B (used for cross-user BOLA testing)."""
    token = create_mock_jwt(USER_B_ID, USER_B_EMAIL)
    return {"Authorization": f"Bearer {token}"}
