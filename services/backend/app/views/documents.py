import logging
import os
import uuid
from typing import Dict, List, Any, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.views.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


async def authenticate_websocket_user(token: str, db: Session) -> User:
    """Authenticate user from WebSocket token (supports email or user id in 'sub')."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        from app.models.user import User

        user: Optional[User] = None
        sub_str = str(sub)

        # Resolve subject: if contains '@' -> treat as email; if digits -> treat as user id
        if "@" in sub_str:
            user = db.query(User).filter(User.email == sub_str).first()
        elif sub_str.isdigit():
            user = db.query(User).filter(User.id == int(sub_str)).first()
        else:
            logger.error(f"WebSocket auth: unsupported token subject format: {sub_str!r}")
            raise HTTPException(status_code=401, detail="Invalid token subject")

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# WebSocket connection manager for document upload progress
class DocumentConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"Document WebSocket connected for user {user_id}")

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"Document WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send document message to user {user_id}: {e}")
                self.disconnect(user_id)


document_manager = DocumentConnectionManager()


# Note for maintainers:
# - Enforces allowed extensions {.pdf, .doc, .docx, .jpg, .jpeg, .png, .txt} and 10MB max size.
# - Reads the uploaded file bytes once, writes from memory (no stream reuse), and persists metadata.
# - Returns a DocumentResponse via model_validate(db_obj) to ensure snake_case serialization from ORM.
@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    category: str = Form(""),
    tags: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload document file with multipart form data"""
    try:
        # Send upload start notification
        await document_manager.send_personal_message(
            {
                "type": "upload_started",
                "filename": file.filename,
                "message": "Document upload started",
                "progress": 0
            },
            current_user.id,
        )

        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Validate file extension (align with onboarding rules)
        allowed_extensions = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"}
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # Send progress update
        await document_manager.send_personal_message(
            {
                "type": "upload_progress",
                "filename": file.filename,
                "message": "Reading file content",
                "progress": 25
            },
            current_user.id,
        )

        content = await file.read()
        file_size = len(content)

        # Enforce 10MB max size for this endpoint
        max_size = 10 * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(status_code=413, detail="File too large")

        # Send progress update
        await document_manager.send_personal_message(
            {
                "type": "upload_progress",
                "filename": file.filename,
                "message": "Saving file to server",
                "progress": 50
            },
            current_user.id,
        )

        os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        # Send progress update
        await document_manager.send_personal_message(
            {
                "type": "upload_progress",
                "filename": file.filename,
                "message": "Creating database record",
                "progress": 75
            },
            current_user.id,
        )

        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []

        from app.models.document import Document

        db_document = Document(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            title=title or file.filename,
            description=description,
            category=category,
            tags=tag_list,
        )

        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        # Send completion notification
        await document_manager.send_personal_message(
            {
                "type": "upload_completed",
                "filename": file.filename,
                "document_id": db_document.id,
                "message": "Document uploaded successfully",
                "progress": 100
            },
            current_user.id,
        )

        return DocumentResponse.model_validate(db_document)

    # Important: allow FastAPI HTTPException to propagate so client receives correct status codes (e.g., 400/413)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Document upload failed: {e}")

        # Send error notification
        await document_manager.send_personal_message(
            {
                "type": "upload_error",
                "filename": file.filename if file and file.filename else "unknown",
                "message": f"Upload failed: {str(e)}",
                "progress": 0
            },
            current_user.id,
        )

        raise HTTPException(status_code=500, detail="Failed to upload document file")


@router.get("/list", response_model=List[DocumentResponse])
async def get_user_documents(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all document files for current user"""
    try:
        from app.models.document import Document

        documents = (
            db.query(Document)
            .filter(Document.user_id == current_user.id)
            .order_by(Document.created_at.desc())
            .all()
        )
        return [DocumentResponse.model_validate(doc) for doc in documents]
    except Exception as e:
        logger.error(f"Failed to get user documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve document files")


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get specific document"""
    try:
        from app.models.document import Document

        document = (
            db.query(Document)
            .filter(Document.id == document_id, Document.user_id == current_user.id)
            .first()
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return DocumentResponse.model_validate(document)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve document")


@router.delete("/{document_id}")
async def delete_document(
    document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete document"""
    try:
        from app.models.document import Document

        document = (
            db.query(Document)
            .filter(Document.id == document_id, Document.user_id == current_user.id)
            .first()
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Delete file if it exists
        if os.path.exists(document.file_path):
            os.remove(document.file_path)

        # Delete database record
        db.delete(document)
        db.commit()

        return {"message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")


@router.post("/onboarding-upload")
async def upload_onboarding_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload document specifically for onboarding process"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Validate file extension
        allowed_extensions = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"}
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}",
            )

        # Validate file size (10MB max)
        max_size = 10 * 1024 * 1024
        content = await file.read()
        file_size = len(content)

        if file_size > max_size:
            raise HTTPException(
                status_code=400, detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB"
            )

        os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        from app.models.document import Document

        db_document = Document(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            title=f"Onboarding Document - {file.filename}",
            description="Document uploaded during onboarding process",
            category="onboarding",
            tags=["onboarding", "medical"],
        )

        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        logger.info(f"Onboarding document uploaded: {file.filename} for user {current_user.id}")

        return {
            "success": True,
            "document_id": db_document.id,
            "filename": file.filename,
            "file_size": file_size,
            "uploaded_at": db_document.created_at.isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding document upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload onboarding document")


# WebSocket endpoint for real-time document upload updates
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time document upload progress updates"""
    try:
        # Authenticate the user
        user = await authenticate_websocket_user(token, db)

        # Verify the user_id matches the authenticated user
        if user.id != user_id:
            await websocket.close(code=1008, reason="User ID mismatch")
            return

        await document_manager.connect(websocket, user_id)
        logger.info(f"Authenticated WebSocket connection for user {user_id}")

        try:
            while True:
                # Keep connection alive and listen for client messages
                data = await websocket.receive_text()
                # Echo back a heartbeat to keep connection alive
                await websocket.send_json({"type": "heartbeat", "message": "connected"})
        except WebSocketDisconnect:
            document_manager.disconnect(user_id)
            logger.info(f"WebSocket disconnected for user {user_id}")
        except Exception as e:
            logger.error(f"Document WebSocket error for user {user_id}: {e}")
            document_manager.disconnect(user_id)

    except HTTPException as e:
        logger.warning(f"WebSocket authentication failed for user {user_id}: {e.detail}")
        await websocket.close(code=1008, reason="Authentication failed")
    except Exception as e:
        logger.error(f"WebSocket connection error for user {user_id}: {e}")
        await websocket.close(code=1011, reason="Internal server error")
