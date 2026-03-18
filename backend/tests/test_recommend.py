import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_recommend_low(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/recommend?risk_label=low", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    for rec in data["recommendations"]:
        assert "category" in rec
        assert "title" in rec
        assert "description" in rec
        assert "priority" in rec


@pytest.mark.asyncio
async def test_recommend_high_includes_professional(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/recommend?risk_label=high", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    categories = [r["category"] for r in data["recommendations"]]
    assert "professional_help" in categories


@pytest.mark.asyncio
async def test_recommend_invalid_label(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/recommend?risk_label=invalid", headers=auth_headers)
    assert resp.status_code == 422  # Validation error
