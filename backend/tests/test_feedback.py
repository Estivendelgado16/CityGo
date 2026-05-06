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


@pytest.mark.asyncio
async def test_submit_feedback(override_auth):
    mock_feedback = {
        "id": 1,
        "user_id": "user-123",
        "place_id": "place-1",
        "rating": 5,
        "comment": "Excelente lugar",
    }

    with patch("app.routers.feedback.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        mock_client.table.return_value.insert.return_value.execute.return_value.data = [mock_feedback]
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"rating": 5}, {"rating": 4}
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/places/place-1/feedback",
                json={"rating": 5, "comment": "Excelente lugar"},
                headers={"Authorization": "Bearer test-token"},
            )

        assert response.status_code == 200
        assert response.json()["data"]["rating"] == 5


@pytest.mark.asyncio
async def test_get_feedback():
    mock_feedback_list = [
        {"id": 1, "rating": 5, "comment": "Excelente", "visited_at": None, "created_at": None},
        {"id": 2, "rating": 4, "comment": "Muy bueno", "visited_at": None, "created_at": None},
    ]

    with patch("app.routers.feedback.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client

        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = mock_feedback_list

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/places/place-1/feedback")

        assert response.status_code == 200
        assert len(response.json()["data"]) == 2
