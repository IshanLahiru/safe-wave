import logging
import os
import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.views.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


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
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        content = await file.read()
        file_size = len(content)

        os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

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

        return db_document.to_dict()

    except Exception as e:
        logger.error(f"Document upload failed: {e}")
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
        return [doc.to_dict() for doc in documents]
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
        return document.to_dict()
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
