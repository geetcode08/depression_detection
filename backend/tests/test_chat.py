import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_send(client: AsyncClient, auth_headers: dict):
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "I hear you. It's okay to feel that way."

        resp = await client.post(
            "/api/v1/chat/send",
            json={"message": "I feel a bit down today"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        assert "session_id" in data
        assert "analysis" in data
        assert "sentiment_score" in data["analysis"]
        assert "risk_score" in data["analysis"]
        assert "risk_label" in data["analysis"]
        assert data["analysis"]["risk_label"] in ("low", "medium", "high")


@pytest.mark.asyncio
async def test_chat_send_creates_session(client: AsyncClient, auth_headers: dict):
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Thank you for sharing."

        resp = await client.post(
            "/api/v1/chat/send",
            json={"message": "Hello"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        session_id = resp.json()["session_id"]
        assert session_id > 0

        # Second message in same session
        resp2 = await client.post(
            "/api/v1/chat/send",
            json={"session_id": session_id, "message": "How are you?"},
            headers=auth_headers,
        )
        assert resp2.status_code == 200
        assert resp2.json()["session_id"] == session_id


@pytest.mark.asyncio
async def test_chat_requires_consent(client: AsyncClient):
    # Register without giving consent
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
