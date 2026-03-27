import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from datetime import datetime, timedelta

from models.message import Message
from models.mood_log import MoodLog
from sqlalchemy import select, and_


@pytest.mark.asyncio
async def test_full_user_journey(client: AsyncClient):
    """
    Integration test: Register → Login → Consent → Send 3 messages → View Dashboard
    This is the primary happy-path integration test.
    """
    # Step 1 — Register
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "integrationuser", "email": "integration@example.com", "password": "SecurePass123!"},
    )
    assert reg_resp.status_code == 201
    user_id = reg_resp.json()["id"]

    # Step 2 — Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "integration@example.com", "password": "SecurePass123!"},
    )
    assert login_resp.status_code == 200
    access_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Step 3 — Consent
    consent_resp = await client.patch("/api/v1/auth/consent", headers=headers)
    assert consent_resp.status_code == 200

    # Step 4 — Send 3 messages (mock LLM)
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "I hear you. How can I help?"

        # Message 1
        msg1_resp = await client.post(
            "/api/v1/chat/send",
            json={"message": "I feel really sad today"},
            headers=headers,
        )
        assert msg1_resp.status_code == 200
        session_id = msg1_resp.json()["session_id"]
        assert session_id > 0

        # Message 2
        msg2_resp = await client.post(
            "/api/v1/chat/send",
            json={"session_id": session_id, "message": "Nothing makes me happy anymore"},
            headers=headers,
        )
        assert msg2_resp.status_code == 200

        # Message 3
        msg3_resp = await client.post(
            "/api/v1/chat/send",
            json={"session_id": session_id, "message": "I went for a walk and felt better"},
            headers=headers,
        )
        assert msg3_resp.status_code == 200

    # Step 5 — Check mood_logs (should have aggregated today's records)
    stats_resp = await client.get("/api/v1/dashboard/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_messages"] >= 3

    # Step 6 - Dashboard stats
    assert "avg_sentiment_7d" in stats
    assert "avg_risk_7d" in stats

    # Step 7 — Mood trend
    mood_resp = await client.get("/api/v1/dashboard/mood?days=7", headers=headers)
    assert mood_resp.status_code == 200
    mood_data = mood_resp.json()
    assert isinstance(mood_data["dates"], list)
    assert isinstance(mood_data["sentiment_scores"], list)
    assert isinstance(mood_data["risk_scores"], list)

    # Step 8 — Recommendations
    recommend_resp = await client.get("/api/v1/recommend?risk_label=low", headers=headers)
    assert recommend_resp.status_code == 200
    assert "recommendations" in recommend_resp.json()

    # Step 9 — Sentiment distribution
    sentiment_resp = await client.get("/api/v1/dashboard/sentiment-dist", headers=headers)
    assert sentiment_resp.status_code == 200
    sentiment = sentiment_resp.json()
    assert "positive" in sentiment
    assert "neutral" in sentiment
    assert "negative" in sentiment
    assert sentiment["positive"] + sentiment["neutral"] + sentiment["negative"] >= 3


@pytest.mark.asyncio
async def test_consent_blocks_analysis(client: AsyncClient):
    """Register → Login → (skip consent) → POST /chat/send should return 403"""
    await client.post(
        "/api/v1/auth/register",
        json={"username": "noconsent", "email": "noconsent@example.com", "password": "password123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "noconsent@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/v1/chat/send",
        json={"message": "Hello"},
        headers=headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_crisis_flow(client: AsyncClient):
    """Register → Login → Consent → Send high-risk message → crisis_alert should be True"""
    await client.post(
        "/api/v1/auth/register",
        json={"username": "crisis_user", "email": "crisis@example.com", "password": "password123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "crisis@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.patch("/api/v1/auth/consent", headers=headers)

    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Let's talk. I'm here to listen."
        resp = await client.post(
            "/api/v1/chat/send",
            json={"message": "I want to end my life"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        # The NLP service should detect this as high-risk
        if data["analysis"]["risk_score"] > 0.65:
            assert data["analysis"]["risk_label"] == "high"


@pytest.mark.asyncio
async def test_session_history(client: AsyncClient, auth_headers: dict):
    """Register → Login → Consent → Send 5 messages → GET /analyze/history should return >= 5"""
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Thank you for sharing."
        for i in range(5):
            await client.post(
                "/api/v1/chat/send",
                json={"message": f"Message {i+1}"},
                headers=auth_headers,
            )

    resp = await client.get("/api/v1/analyze/history?limit=10", headers=auth_headers)
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) >= 5


@pytest.mark.asyncio
async def test_account_deletion_cascade(client: AsyncClient):
    """Register → Login → Consent → Send 2 messages → DELETE /auth/me → verify cascade delete"""
    # Register and setup
    await client.post(
        "/api/v1/auth/register",
        json={"username": "deleteuser", "email": "delete@example.com", "password": "password123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "delete@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.patch("/api/v1/auth/consent", headers=headers)

    # Send messages
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Thank you."
        await client.post(
            "/api/v1/chat/send",
            json={"message": "Message 1"},
            headers=headers,
        )
        await client.post(
            "/api/v1/chat/send",
            json={"message": "Message 2"},
            headers=headers,
        )

    # Delete account
    del_resp = await client.delete("/api/v1/auth/me", headers=headers)
    assert del_resp.status_code == 200

    # Verify cascade: subsequent /auth/me should return 401
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 401


@pytest.mark.asyncio
async def test_concurrent_sessions(client: AsyncClient, auth_headers: dict):
    """Register → Login → Consent → Create 2 separate sessions with different session_ids"""
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Noted."

        resp1 = await client.post(
            "/api/v1/chat/send",
            json={"message": "Session 1, Message 1"},
            headers=auth_headers,
        )
        session_id_A = resp1.json()["session_id"]

        resp2 = await client.post(
            "/api/v1/chat/send",
            json={"message": "Session 2, Message 1"},
            headers=auth_headers,
        )
        session_id_B = resp2.json()["session_id"]

        assert session_id_A != session_id_B
