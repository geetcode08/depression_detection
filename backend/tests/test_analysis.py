import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analyze_text(client: AsyncClient, auth_headers: dict):
    resp = await client.post(
        "/api/v1/analyze",
        json={"text": "I feel exhausted and overwhelmed lately."},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "sentiment_score" in data
    assert "risk_score" in data
    assert "risk_label" in data
    assert "top_keywords" in data


@pytest.mark.asyncio
async def test_analysis_history(client: AsyncClient, auth_headers: dict):
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Thank you for sharing."
        await client.post(
            "/api/v1/chat/send",
            json={"message": "I am feeling low today."},
            headers=auth_headers,
        )

    resp = await client.get("/api/v1/analyze/history?limit=10", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "content" in data[0]
    assert "depression_risk_score" in data[0]


@pytest.mark.asyncio
async def test_session_analysis(client: AsyncClient, auth_headers: dict):
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "I hear you."
        send_resp = await client.post(
            "/api/v1/chat/send",
            json={"message": "I feel isolated."},
            headers=auth_headers,
        )

    session_id = send_resp.json()["session_id"]
    resp = await client.get(f"/api/v1/analyze/session/{session_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == session_id
    assert "avg_sentiment" in data
    assert "avg_risk_score" in data
    assert "dominant_risk_label" in data
