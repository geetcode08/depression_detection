import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "newuser", "email": "new@example.com", "password": "password123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "newuser"
    assert data["email"] == "new@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "user1", "email": "dup@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "user2", "email": "dup@example.com", "password": "password123"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "sameuser", "email": "a@test.com", "password": "password123"},
    )
    response = await client.post(
        "/api/v1/auth/register",
        json={"username": "sameuser", "email": "b@test.com", "password": "password123"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "loginuser", "email": "login@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "wrongpw", "email": "wrong@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "ghost@test.com", "password": "anypass123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_invalid_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "testuser"
    assert data["consent_given"] is True


@pytest.mark.asyncio
async def test_consent(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "consentuser", "email": "consent@example.com", "password": "password123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "consent@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.patch("/api/v1/auth/consent", headers=headers)
    assert resp.status_code == 200

    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.json()["consent_given"] is True


@pytest.mark.asyncio
async def test_delete_account(client: AsyncClient, auth_headers: dict):
    resp = await client.delete("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200

    # Should be unauthorized now
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_account_cascades(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "deletetest", "email": "del@test.com", "password": "password123"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "del@test.com", "password": "password123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.patch("/api/v1/auth/consent", headers=headers)
    await client.post("/api/v1/chat/send", json={"message": "hello"}, headers=headers)

    response = await client.delete("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200

    me_response = await client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 401


@pytest.mark.asyncio
async def test_anonymous_user(client: AsyncClient):
    resp = await client.post("/api/v1/auth/anonymous")
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
