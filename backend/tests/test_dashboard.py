import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_dashboard_stats(client: AsyncClient, auth_headers: dict):
    # Send a few messages first
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "I'm here for you."
        for msg in ["Hello", "I'm okay", "Feeling fine"]:
            await client.post(
                "/api/v1/chat/send",
                json={"message": msg},
                headers=auth_headers,
            )

    resp = await client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_messages"] >= 3
    assert "avg_sentiment_7d" in data
    assert "avg_risk_7d" in data
    assert "current_streak_days" in data
    assert "cumulative_words" in data
    assert "dashboard_tier" in data


@pytest.mark.asyncio
async def test_dashboard_mood(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/dashboard/mood?days=30", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "dates" in data
    assert "sentiment_scores" in data
    assert "risk_scores" in data


@pytest.mark.asyncio
async def test_dashboard_sentiment_dist(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/dashboard/sentiment-dist", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "positive" in data
    assert "neutral" in data
    assert "negative" in data


@pytest.mark.asyncio
async def test_dashboard_behavior(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/dashboard/behavior", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "late_night_days" in data
    assert "avg_message_length" in data
    assert "most_active_hour" in data
    assert "weekly_frequency" in data
    assert len(data["weekly_frequency"]) == 7


@pytest.mark.asyncio
async def test_dashboard_tier_advances_with_words(client: AsyncClient, auth_headers: dict):
    """After enough words, dashboard_tier should advance from no_data."""
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "I hear you."
        long_message = " ".join(["feeling quite overwhelmed by everything today"] * 5)
        for _ in range(3):
            await client.post(
                "/api/v1/chat/send",
                json={"message": long_message},
                headers=auth_headers,
            )

    stats_resp = await client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["cumulative_words"] >= 50
    assert stats["dashboard_tier"] != "no_data"
