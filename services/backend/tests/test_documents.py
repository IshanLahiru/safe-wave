import pytest
from fastapi.testclient import TestClient
import os
from unittest.mock import patch, MagicMock

# Define a dummy document file for testing
DUMMY_DOCUMENT_PATH = "services/backend/tests/dummy_document.txt"
DUMMY_PDF_PATH = "services/backend/tests/dummy.pdf"

@pytest.fixture(scope="module", autouse=True)
def create_dummy_document_files():
    """Create dummy document files for testing purposes."""
    if not os.path.exists(DUMMY_DOCUMENT_PATH):
        with open(DUMMY_DOCUMENT_PATH, "w") as f:
            f.write("This is a dummy document for testing.")
    
    # Create a minimal valid PDF file (binary content)
    if not os.path.exists(DUMMY_PDF_PATH):
        with open(DUMMY_PDF_PATH, "wb") as f:
            f.write(b"%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000050 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n103\n%%EOF")
    
    yield
    
    if os.path.exists(DUMMY_DOCUMENT_PATH):
        os.remove(DUMMY_DOCUMENT_PATH)
    if os.path.exists(DUMMY_PDF_PATH):
        os.remove(DUMMY_PDF_PATH)

@pytest.fixture
def authenticated_client(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "doc_user@example.com", "password": "testpassword", "name": "Document Test User"}
    )
    # Login to get tokens
    response = client.post(
        "/auth/login",
        json={"email": "doc_user@example.com", "password": "testpassword"}
    )
    access_token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {access_token}"
    yield client
    client.headers.pop("Authorization")

def test_upload_document(authenticated_client: TestClient):
    with open(DUMMY_DOCUMENT_PATH, "rb") as f:
        response = authenticated_client.post(
            "/documents/upload",
            files={"file": ("dummy_document.txt", f, "text/plain")},
            data={
                "title": "My Test Document",
                "description": "A document for testing purposes",
                "category": "Test",
                "tags": "test,example"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "My Test Document"
    assert data["filename"] == "dummy_document.txt"
    assert data["category"] == "Test"
    assert "id" in data

    # Clean up the uploaded file
    uploaded_file_path = os.path.join("services/backend/uploads/documents", os.path.basename(data["filePath"]))
    if os.path.exists(uploaded_file_path):
        os.remove(uploaded_file_path)

def test_get_user_documents(authenticated_client: TestClient):
    # Upload a document first
    with open(DUMMY_DOCUMENT_PATH, "rb") as f:
        authenticated_client.post(
            "/documents/upload",
            files={"file": ("dummy_document_2.txt", f, "text/plain")},
            data={"title": "Another Document"}
        )

    response = authenticated_client.get("/documents/list")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(doc["title"] == "Another Document" for doc in data)

    # Clean up uploaded files
    for doc in data:
        uploaded_file_path = os.path.join("services/backend/uploads/documents", os.path.basename(doc["filePath"]))
        if os.path.exists(uploaded_file_path):
            os.remove(uploaded_file_path)

def test_get_document(authenticated_client: TestClient):
    # Upload a document first
    with open(DUMMY_DOCUMENT_PATH, "rb") as f:
        upload_response = authenticated_client.post(
            "/documents/upload",
            files={"file": ("dummy_document_3.txt", f, "text/plain")},
            data={"title": "Specific Document"}
        )
    document_id = upload_response.json()["id"]

    response = authenticated_client.get(f"/documents/{document_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == document_id
    assert data["title"] == "Specific Document"

    # Clean up uploaded file
    uploaded_file_path = os.path.join("services/backend/uploads/documents", os.path.basename(data["filePath"]))
    if os.path.exists(uploaded_file_path):
        os.remove(uploaded_file_path)

def test_delete_document(authenticated_client: TestClient):
    # Upload a document first
    with open(DUMMY_DOCUMENT_PATH, "rb") as f:
        upload_response = authenticated_client.post(
            "/documents/upload",
            files={"file": ("dummy_document_4.txt", f, "text/plain")},
            data={"title": "Document to Delete"}
        )
    document_id = upload_response.json()["id"]
    file_path = os.path.join("services/backend/uploads/documents", os.path.basename(upload_response.json()["filePath"]))

    # Ensure file exists before deletion
    assert os.path.exists(file_path)

    delete_response = authenticated_client.delete(f"/documents/{document_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "Document deleted successfully"}

    # Ensure file is deleted from disk
    assert not os.path.exists(file_path)

    # Ensure document is no longer retrievable
    get_response = authenticated_client.get(f"/documents/{document_id}")
    assert get_response.status_code == 404

def test_download_document(authenticated_client: TestClient):
    # Upload a document first
    with open(DUMMY_DOCUMENT_PATH, "rb") as f:
        upload_response = authenticated_client.post(
            "/documents/upload",
            files={"file": ("download_document.txt", f, "text/plain")},
            data={"title": "Downloadable Document"}
        )
    document_id = upload_response.json()["id"]
    file_path = os.path.join("services/backend/uploads/documents", os.path.basename(upload_response.json()["filePath"]))

    response = authenticated_client.get(f"/documents/{document_id}/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain"
    assert response.headers["content-disposition"] == 'attachment; filename="download_document.txt"'
    assert response.content == b"This is a dummy document for testing."

    # Clean up uploaded file
    if os.path.exists(file_path):
        os.remove(file_path)

def test_upload_onboarding_document(authenticated_client: TestClient):
    with open(DUMMY_PDF_PATH, "rb") as f:
        response = authenticated_client.post(
            "/documents/onboarding-upload",
            files={"file": ("onboarding_doc.pdf", f, "application/pdf")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "onboarding_doc.pdf"
    assert "document_id" in data

    # Clean up the uploaded file
    uploaded_file_path = os.path.join("services/backend/uploads/documents", os.path.basename(data["filename"]))
    if os.path.exists(uploaded_file_path):
        os.remove(uploaded_file_path)