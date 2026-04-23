import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_without_consent_returns_403(client: AsyncClient, auth_headers_no_consent: dict):
    response = await client.post(
        "/api/v1/chat/send",
        json={"message": "hello"},
        headers=auth_headers_no_consent,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_chat_empty_message_returns_422_for_existing_session(client: AsyncClient, auth_headers: dict):
    with patch("services.llm_service.get_session_opener", new_callable=AsyncMock) as opener_mock:
        opener_mock.return_value = "Hey, I am Aura."
        created = await client.post(
            "/api/v1/chat/new-session",
            headers=auth_headers,
        )

    session_id = created.json()["session_id"]
    response = await client.post(
        "/api/v1/chat/send",
        json={"session_id": session_id, "message": ""},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_new_session_returns_opener(client: AsyncClient, auth_headers: dict):
    with patch("services.llm_service.get_session_opener", new_callable=AsyncMock) as opener_mock:
        opener_mock.return_value = "Hey, I am Aura. What is on your mind today?"
        response = await client.post("/api/v1/chat/new-session", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["is_opener"] is True
    assert data["crisis_alert"] is False
    assert data["reply"]
    assert data["analysis"]["analysis_tier"] == "gathering"


@pytest.mark.asyncio
async def test_short_message_stays_in_gathering_tier(client: AsyncClient, auth_headers: dict):
    with patch("services.llm_service.get_session_opener", new_callable=AsyncMock) as opener_mock, patch(
        "routers.chat.get_llm_reply", new_callable=AsyncMock
    ) as llm_mock:
        opener_mock.return_value = "Hey, I am Aura."
        llm_mock.return_value = "I hear you."
        response = await client.post(
            "/api/v1/chat/send",
            json={"message": "hello there"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert opener_mock.await_count == 0
    assert data["analysis"]["analysis_tier"] == "gathering"
    assert data["analysis"]["risk_score"] is None


@pytest.mark.asyncio
async def test_chat_send_creates_and_reuses_session(client: AsyncClient, auth_headers: dict):
    with patch("services.llm_service.get_session_opener", new_callable=AsyncMock) as opener_mock, patch(
        "routers.chat.get_llm_reply", new_callable=AsyncMock
    ) as llm_mock:
        opener_mock.return_value = "Hey, I am Aura."
        llm_mock.return_value = "Thanks for sharing."

        first = await client.post(
            "/api/v1/chat/send",
            json={"message": "I am feeling okay"},
            headers=auth_headers,
        )
        assert first.status_code == 200
        session_id = first.json()["session_id"]

        second = await client.post(
            "/api/v1/chat/send",
            json={"session_id": session_id, "message": "Today was stressful"},
            headers=auth_headers,
        )

    assert second.status_code == 200
    assert second.json()["session_id"] == session_id
    assert opener_mock.await_count == 0


@pytest.mark.asyncio
async def test_high_risk_message_returns_crisis_alert_only_full_tier(
    client: AsyncClient,
    auth_headers: dict,
    mock_high_risk_nlp,
):
    with patch("services.llm_service.get_session_opener", new_callable=AsyncMock) as opener_mock, patch(
        "routers.chat.get_llm_reply", new_callable=AsyncMock
    ) as llm_mock, patch(
        "routers.chat.nlp_service.count_user_words_in_session", new_callable=AsyncMock
    ) as session_words_mock, patch(
        "routers.chat.nlp_service.count_user_words_cumulative", new_callable=AsyncMock
    ) as cumulative_words_mock:
        opener_mock.return_value = "Hey, I am Aura."
        llm_mock.return_value = "I am here with you."
        session_words_mock.return_value = 600
        cumulative_words_mock.return_value = 1000

        response = await client.post(
            "/api/v1/chat/send",
            json={"message": "I want to hurt myself"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["analysis"]["risk_label"] == "high"
    assert data["analysis"]["crisis_alert"] is True
    assert data["crisis_alert"] is True


@pytest.mark.asyncio
async def test_crisis_alert_fires_in_early_tier(client: AsyncClient, auth_headers: dict):
    """Crisis alert must fire even on first message if crisis language detected."""
    with patch("routers.chat.get_llm_reply", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Please reach out to iCall."
        resp = await client.post(
            "/api/v1/chat/send",
            json={"message": "I want to kill myself right now"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["analysis"]["crisis_alert"] is True
    assert data["crisis_alert"] is True
