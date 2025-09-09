import pytest
from fastapi.testclient import TestClient
import os
from unittest.mock import patch, MagicMock

# Define a dummy audio file for testing
DUMMY_AUDIO_PATH = "services/backend/tests/dummy_audio.wav"

@pytest.fixture(scope="module", autouse=True)
def create_dummy_audio_file():
    """Create a dummy audio file for testing purposes."""
    if not os.path.exists(DUMMY_AUDIO_PATH):
        with open(DUMMY_AUDIO_PATH, "wb") as f:
            f.write(b"RIFF\x00\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88\xac\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    yield
    if os.path.exists(DUMMY_AUDIO_PATH):
        os.remove(DUMMY_AUDIO_PATH)

@pytest.fixture
def authenticated_client(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "audio_user@example.com", "password": "testpassword", "name": "Audio Test User"}
    )
    # Login to get tokens
    response = client.post(
        "/auth/login",
        json={"email": "audio_user@example.com", "password": "testpassword"}
    )
    access_token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {access_token}"
    yield client
    client.headers.pop("Authorization")

@patch("services.backend.app.controllers.audio_controller.audio_controller.transcribe_audio")
@patch("services.backend.app.controllers.audio_controller.audio_controller.analyze_with_llm")
@patch("services.backend.app.controllers.audio_controller.audio_controller.send_immediate_voice_alert")
def test_upload_audio(
    mock_send_alert: MagicMock,
    mock_analyze_llm: MagicMock,
    mock_transcribe_audio: MagicMock,
    authenticated_client: TestClient
):
    mock_transcribe_audio.return_value = ("This is a test transcription.", 0.95, 10.0)
    mock_analyze_llm.return_value = {
        "risk_level": "low",
        "summary": "User expressed mild stress.",
        "recommendations": ["Practice mindfulness."],
    }
    mock_send_alert.return_value = True

    with open(DUMMY_AUDIO_PATH, "rb") as f:
        response = authenticated_client.post(
            "/audio/upload",
            files={"file": ("dummy_audio.wav", f, "audio/wav")},
            data={"description": "Test audio upload", "mood_rating": 7}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Test audio upload"
    assert data["moodRating"] == 7
    assert data["filename"] == "dummy_audio.wav"
    assert data["transcriptionStatus"] == "processing" # Initial status
    assert data["analysisStatus"] == "pending" # Initial status

    # Verify background tasks were called
    mock_transcribe_audio.assert_called_once()
    mock_analyze_llm.assert_called_once()
    mock_send_alert.assert_called_once()

    # Clean up the uploaded file
    uploaded_file_path = data["filePath"]
    if os.path.exists(uploaded_file_path):
        os.remove(uploaded_file_path)

def test_get_user_audios(authenticated_client: TestClient):
    # Upload an audio first
    with open(DUMMY_AUDIO_PATH, "rb") as f:
        authenticated_client.post(
            "/audio/upload",
            files={"file": ("dummy_audio_2.wav", f, "audio/wav")},
            data={"description": "Another test audio", "mood_rating": 6}
        )

    response = authenticated_client.get("/audio/list")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(audio["description"] == "Another test audio" for audio in data)

    # Clean up uploaded files
    for audio in data:
        if os.path.exists(audio["filePath"]):
            os.remove(audio["filePath"])

def test_get_audio(authenticated_client: TestClient):
    # Upload an audio first
    with open(DUMMY_AUDIO_PATH, "rb") as f:
        upload_response = authenticated_client.post(
            "/audio/upload",
            files={"file": ("dummy_audio_3.wav", f, "audio/wav")},
            data={"description": "Specific audio test", "mood_rating": 8}
        )
    audio_id = upload_response.json()["id"]

    response = authenticated_client.get(f"/audio/{audio_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == audio_id
    assert data["description"] == "Specific audio test"

    # Clean up uploaded file
    uploaded_file_path = data["filePath"]
    if os.path.exists(uploaded_file_path):
        os.remove(uploaded_file_path)

def test_delete_audio(authenticated_client: TestClient):
    # Upload an audio first
    with open(DUMMY_AUDIO_PATH, "rb") as f:
        upload_response = authenticated_client.post(
            "/audio/upload",
            files={"file": ("dummy_audio_4.wav", f, "audio/wav")},
            data={"description": "Audio to delete", "mood_rating": 5}
        )
    audio_id = upload_response.json()["id"]
    file_path = upload_response.json()["filePath"]

    # Ensure file exists before deletion
    assert os.path.exists(file_path)

    delete_response = authenticated_client.delete(f"/audio/{audio_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "Audio deleted successfully"}

    # Ensure file is deleted from disk
    assert not os.path.exists(file_path)

    # Ensure audio is no longer retrievable
    get_response = authenticated_client.get(f"/audio/{audio_id}")
    assert get_response.status_code == 404