import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


def pytest_configure(config):
    config.addinivalue_line("markers", "integration: tests that connect to real Supabase/DB")


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")
