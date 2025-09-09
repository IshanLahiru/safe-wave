import pytest
from fastapi.testclient import TestClient

def test_create_user(client: TestClient):
    response = client.post(
        "/auth/signup",
        json={"email": "test@example.com", "password": "testpassword", "name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_for_access_token(client: TestClient):
    # First, create a user
    client.post(
        "/auth/signup",
        json={"email": "login@example.com", "password": "loginpassword", "name": "Login User"}
    )

    # Then, attempt to login
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "loginpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_for_access_token_invalid_credentials(client: TestClient):
    # Attempt to login with non-existent user
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}

    # Attempt to login with correct email but wrong password
    client.post(
        "/auth/signup",
        json={"email": "wrongpass@example.com", "password": "correctpassword", "name": "Wrong Pass User"}
    )
    response = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}

def test_get_current_user(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "current@example.com", "password": "currentpassword", "name": "Current User"}
    )

    # Login to get tokens
    login_response = client.post(
        "/auth/login",
        json={"email": "current@example.com", "password": "currentpassword"}
    )
    access_token = login_response.json()["access_token"]

    # Use the access token to get current user
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"
    assert data["name"] == "Current User"
    assert data["role"] == "user"

def test_logout(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "logout@example.com", "password": "logoutpassword", "name": "Logout User"}
    )

    # Login to get tokens
    login_response = client.post(
        "/auth/login",
        json={"email": "logout@example.com", "password": "logoutpassword"}
    )
    access_token = login_response.json()["access_token"]

    # Logout
    logout_response = client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert logout_response.status_code == 200
    assert logout_response.json() == {"message": "Successfully logged out"}

    # Try to access a protected endpoint with the blacklisted token
    protected_response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert protected_response.status_code == 401
    assert protected_response.json() == {"detail": "Could not validate credentials"}

def test_refresh_token(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "refresh@example.com", "password": "refreshpassword", "name": "Refresh User"}
    )

    # Login to get tokens
    login_response = client.post(
        "/auth/login",
        json={"email": "refresh@example.com", "password": "refreshpassword"}
    )
    refresh_token = login_response.json()["refresh_token"]

    # Refresh the token
    refresh_response = client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # Ensure the new access token works
    new_access_token = data["access_token"]
    protected_response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {new_access_token}"}
    )
    assert protected_response.status_code == 200
    assert protected_response.json()["email"] == "refresh@example.com"