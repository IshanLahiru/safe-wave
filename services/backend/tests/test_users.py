import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def authenticated_client(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "user@example.com", "password": "testpassword", "name": "Test User"}
    )
    # Login to get tokens
    response = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "testpassword"}
    )
    access_token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {access_token}"
    yield client
    client.headers.pop("Authorization")

def test_get_current_user(authenticated_client: TestClient):
    response = authenticated_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    assert data["name"] == "Test User"
    assert data["role"] == "user"

def test_update_user_profile(authenticated_client: TestClient):
    response = authenticated_client.put(
        "/users/me",
        json={"name": "Updated Name", "care_person_email": "care@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["carePersonEmail"] == "care@example.com"

    # Verify the update by fetching the user again
    response = authenticated_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["carePersonEmail"] == "care@example.com"

def test_complete_onboarding(authenticated_client: TestClient):
    onboarding_data = {
        "emergency_contact_name": "Emergency Contact",
        "emergency_contact_email": "emergency@example.com",
        "emergency_contact_relationship": "Friend",
        "care_person_email": "careperson@example.com",
        "checkin_frequency": "Daily",
        "daily_struggles": "Stress",
        "coping_mechanisms": "Meditation",
        "stress_level": 5,
        "sleep_quality": 7,
        "app_goals": "Reduce stress"
    }
    response = authenticated_client.post(
        "/users/onboarding",
        json=onboarding_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["isOnboardingComplete"] is True
    assert data["emergencyContact"]["name"] == "Emergency Contact"
    assert data["carePersonEmail"] == "careperson@example.com"

    # Verify the update by fetching the user again
    response = authenticated_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["isOnboardingComplete"] is True
    assert data["emergencyContact"]["name"] == "Emergency Contact"
    assert data["carePersonEmail"] == "careperson@example.com"

def test_update_user_preferences(authenticated_client: TestClient):
    preferences_data = {
        "checkinFrequency": "Weekly",
        "darkMode": True,
        "language": "es"
    }
    response = authenticated_client.put(
        "/users/preferences",
        json=preferences_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["preferences"]["checkinFrequency"] == "Weekly"
    assert data["preferences"]["darkMode"] is True
    assert data["preferences"]["language"] == "es"

    # Verify the update by fetching the user again
    response = authenticated_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["preferences"]["checkinFrequency"] == "Weekly"
    assert data["preferences"]["darkMode"] is True
    assert data["preferences"]["language"] == "es"