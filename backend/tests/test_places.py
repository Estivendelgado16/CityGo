import pytest
from unittest.mock import patch, MagicMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_current_user


@pytest.fixture
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-123", "email": "test@test.com"}
    yield
    app.dependency_overrides = {}


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token"}


@pytest.mark.asyncio
async def test_get_place_found():
    mock_place = {"id": "place-1", "name": "El Cielo", "zone": "El Poblado"}

    with patch("app.routers.places.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_place

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/places/place-1")

        assert response.status_code == 200
        assert response.json()["data"]["name"] == "El Cielo"


@pytest.mark.asyncio
async def test_get_place_not_found():
    with patch("app.routers.places.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/places/place-999")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_save_place(override_auth, auth_headers):
    with patch("app.routers.places.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/places/place-1/save",
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert response.json()["data"]["saved"] is True


@pytest.mark.asyncio
async def test_unsave_place(override_auth, auth_headers):
    with patch("app.routers.places.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.delete(
                "/api/places/place-1/save",
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert response.json()["data"]["saved"] is False


@pytest.mark.asyncio
async def test_get_saved_places(override_auth, auth_headers):
    mock_saved = [
        {"id": 1, "place_id": "place-1", "places": {"name": "El Cielo"}},
        {"id": 2, "place_id": "place-2", "places": {"name": "Mondongos"}},
    ]

    with patch("app.routers.places.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = mock_saved

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/saved-places",
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert len(response.json()["data"]) == 2


@pytest.mark.asyncio
async def test_get_saved_places_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/saved-places")

    assert response.status_code == 401
