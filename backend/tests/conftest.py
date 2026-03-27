import asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from database import Base, get_db
from main import app
from schemas.analysis import AnalysisResult

# Test database (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    import models  # noqa: F401
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict:
    """Register a user and return auth headers."""
    await client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "testpass123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpass123"},
    )
    token = login_resp.json()["access_token"]

    # Give consent
    headers = {"Authorization": f"Bearer {token}"}
    await client.patch("/api/v1/auth/consent", headers=headers)

    return headers


@pytest_asyncio.fixture
async def auth_headers_no_consent(client: AsyncClient) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"username": "noconsent_user", "email": "noconsent@test.com", "password": "testpass123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "noconsent@test.com", "password": "testpass123"},
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_high_risk_nlp():
    with patch("routers.chat.nlp_service.analyze_with_threshold", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = AnalysisResult(
            sentiment_score=-0.9,
            risk_score=0.95,
            risk_label="high",
            top_keywords=["hurt", "myself"],
            confidence=0.98,
            emotion_label=None,
            analysis_tier="full_assessment",
            words_until_next_tier=None,
            longitudinal_patterns_available=False,
            behavioral_profile_available=False,
            crisis_alert=True,
        )
        yield mock_analyze
