from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
import uuid
from datetime import datetime
from typing import List
import aiofiles
from app.core.database import get_db
from app.views.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document for the current user"""
    try:
        # Validate file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Validate file size
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Create unique filename
        unique_id = str(uuid.uuid4())
        safe_filename = f"{unique_id}_{file.filename}"
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(settings.UPLOAD_DIR, "documents")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, safe_filename)
        
        # Read and save file content
        content = await file.read()
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create document record in database
        document = Document(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            content_type=file.content_type,
            document_type="medical",
            uploaded_at=datetime.utcnow()
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        logger.info(f"Document uploaded successfully: {file.filename} for user {current_user.id}")
        
        return {
            "success": True,
            "document_id": document.id,
            "filename": file.filename,
            "file_size": len(content),
            "uploaded_at": document.uploaded_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )

@router.get("/documents")
async def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for the current user"""
    try:
        documents = db.query(Document).filter(Document.user_id == current_user.id).all()
        
        return {
            "documents": [
                {
                    "id": doc.id,
                    "filename": doc.filename,
                    "file_size": doc.file_size,
                    "content_type": doc.content_type,
                    "document_type": doc.document_type,
                    "uploaded_at": doc.uploaded_at.isoformat()
                }
                for doc in documents
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch documents"
        )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Delete file from filesystem
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete from database
        db.delete(document)
        db.commit()
        
        logger.info(f"Document deleted successfully: {document.filename} for user {current_user.id}")
        
        return {"success": True, "message": "Document deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )
