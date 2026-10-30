"""Tests for Favourites API routes including duplicate rejection and BOLA protection."""
from fastapi.testclient import TestClient


def test_add_and_list_favourite(client: TestClient, auth_headers_user_a: dict[str, str]):
    """User can add place to favourites and list saved items."""
    fav_payload = {
        "place_id": "nominatim-123456",
        "name": "Amber Palace",
        "display_name": "Amber Palace, Devisinghpura, Amer, Jaipur, Rajasthan",
        "latitude": 26.9855,
        "longitude": 75.8513,
        "category": "tourism",
        "type": "attraction",
        "provider": "nominatim",
    }
    response = client.post("/api/v1/favourites", json=fav_payload, headers=auth_headers_user_a)
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["name"] == "Amber Palace"
    fav_id = body["data"]["id"]

    # Listing favourites includes the new item
    list_res = client.get("/api/v1/favourites", headers=auth_headers_user_a)
    assert list_res.status_code == 200
    assert list_res.json()["data"]["total"] >= 1


def test_duplicate_favourite_returns_409(client: TestClient, auth_headers_user_a: dict[str, str]):
    """Adding the same place_id again returns 409 Conflict."""
    fav_payload = {
        "place_id": "unique-fort-789",
        "name": "Nahargarh Fort",
        "latitude": 26.9373,
        "longitude": 75.8155,
    }
    res1 = client.post("/api/v1/favourites", json=fav_payload, headers=auth_headers_user_a)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/favourites", json=fav_payload, headers=auth_headers_user_a)
    assert res2.status_code == 409
    body = res2.json()
    assert body["success"] is False
    assert body["error"]["code"] == "FAVOURITE_ALREADY_EXISTS"


def test_favourite_bola_deletion_prevention(
    client: TestClient,
    auth_headers_user_a: dict[str, str],
    auth_headers_user_b: dict[str, str],
):
    """User B cannot delete User A's favourite bookmark."""
    create_res = client.post(
        "/api/v1/favourites",
        json={
            "place_id": "hawa-mahal-001",
            "name": "Hawa Mahal",
            "latitude": 26.9239,
            "longitude": 75.8267,
        },
        headers=auth_headers_user_a,
    )
    assert create_res.status_code == 201
    fav_id = create_res.json()["data"]["id"]

    # User B attempts to delete User A's bookmark
    del_res_b = client.delete(f"/api/v1/favourites/{fav_id}", headers=auth_headers_user_b)
    assert del_res_b.status_code in (403, 404)

    # User A successfully deletes own bookmark
    del_res_a = client.delete(f"/api/v1/favourites/{fav_id}", headers=auth_headers_user_a)
    assert del_res_a.status_code == 200
    assert del_res_a.json()["data"]["deleted"] is True
