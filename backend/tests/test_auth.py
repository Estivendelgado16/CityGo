import pytest
from unittest.mock import patch, MagicMock
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_success():
    mock_user = MagicMock()
    mock_user.id = "user-123"
    mock_user.email = "test@test.com"

    mock_session = MagicMock()
    mock_session.access_token = "token-123"

    mock_response = MagicMock()
    mock_response.user = mock_user
    mock_response.session = mock_session

    with patch("app.routers.auth.get_supabase_anon") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client
        mock_client.auth.sign_up.return_value = mock_response

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/auth/register", json={
                "email": "test@test.com",
                "password": "123456",
                "name": "Test User",
            })

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["user"]["email"] == "test@test.com"
        assert data["data"]["token"] == "token-123"


@pytest.mark.asyncio
async def test_register_error():
    with patch("app.routers.auth.get_supabase_anon") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client
        mock_client.auth.sign_up.side_effect = Exception("Email already registered")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/auth/register", json={
                "email": "existing@test.com",
                "password": "123456",
                "name": "Test",
            })

        assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success():
    mock_user = MagicMock()
    mock_user.id = "user-123"
    mock_user.email = "test@test.com"
    mock_user.user_metadata = {"name": "Test User"}

    mock_session = MagicMock()
    mock_session.access_token = "token-123"
    mock_session.refresh_token = "refresh-123"

    mock_response = MagicMock()
    mock_response.user = mock_user
    mock_response.session = mock_session

    with patch("app.routers.auth.get_supabase_anon") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client
        mock_client.auth.sign_in_with_password.return_value = mock_response

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/auth/login", json={
                "email": "test@test.com",
                "password": "123456",
            })

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["token"] == "token-123"
        assert data["data"]["refresh_token"] == "refresh-123"


@pytest.mark.asyncio
async def test_login_invalid():
    with patch("app.routers.auth.get_supabase_anon") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client
        mock_client.auth.sign_in_with_password.side_effect = Exception("Invalid credentials")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/auth/login", json={
                "email": "wrong@test.com",
                "password": "wrong",
            })

        assert response.status_code == 401
