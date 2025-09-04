import logging
import os
import uuid
from typing import Dict, List, Any, Optional, Tuple

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse

logger = logging.getLogger(__name__)


class DocumentController:
    """Handles document business logic including upload, storage, validation, and management"""

    def __init__(self):
        self.allowed_extensions = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"}
        self.max_file_size = 10 * 1024 * 1024  # 10MB

    def validate_file(self, file: UploadFile) -> Tuple[bool, str]:
        """Validate file extension and basic properties"""
        if not file.filename:
            return False, "No file provided"

        # Check file extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in self.allowed_extensions:
            return False, f"Unsupported file type. Allowed: {', '.join(self.allowed_extensions)}"

        return True, "File validation passed"

    def validate_file_size(self, content: bytes) -> Tuple[bool, str]:
        """Validate file size"""
        file_size = len(content)
        if file_size > self.max_file_size:
            max_mb = self.max_file_size // (1024 * 1024)
            return False, f"File too large. Maximum size: {max_mb}MB"

        return True, "File size validation passed"

    async def save_file(self, file: UploadFile, content: bytes) -> Tuple[str, str]:
        """Save file to disk and return file path and unique filename"""
        # Create upload directory if it doesn't exist
        os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, unique_filename)

        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"File saved: {file_path}")
        return file_path, unique_filename

    def create_document_record(
        self,
        db: Session,
        user: User,
        file: UploadFile,
        file_path: str,
        file_size: int,
        title: str = "",
        description: str = "",
        category: str = "",
        tags: str = ""
    ) -> Document:
        """Create document record in database"""
        # Process tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []

        # Create document record
        db_document = Document(
            user_id=user.id,
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

        logger.info(f"Document record created: ID {db_document.id}")
        return db_document

    def get_user_documents(self, db: Session, user: User, limit: int = 50, offset: int = 0) -> List[Document]:
        """Get all documents for a user"""
        documents = (
            db.query(Document)
            .filter(Document.user_id == user.id)
            .order_by(Document.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        return documents

    def get_document_by_id(self, db: Session, user: User, document_id: int) -> Optional[Document]:
        """Get specific document by ID for a user"""
        document = (
            db.query(Document)
            .filter(Document.id == document_id, Document.user_id == user.id)
            .first()
        )
        return document

    def update_document(self, db: Session, document: Document, update_data: DocumentUpdate) -> Document:
        """Update document record"""
        update_dict = update_data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            setattr(document, field, value)

        db.commit()
        db.refresh(document)

        logger.info(f"Document updated: ID {document.id}")
        return document

    def delete_document(self, db: Session, document: Document) -> bool:
        """Delete document record and file"""
        try:
            # Delete file from disk
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
                logger.info(f"File deleted: {document.file_path}")

            # Delete database record
            db.delete(document)
            db.commit()

            logger.info(f"Document deleted: ID {document.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {document.id}: {e}")
            db.rollback()
            return False

    async def process_upload(
        self,
        db: Session,
        user: User,
        file: UploadFile,
        title: str = "",
        description: str = "",
        category: str = "",
        tags: str = ""
    ) -> Document:
        """Complete document upload process with validation and storage"""
        # Validate file
        is_valid, message = self.validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)

        # Read file content
        content = await file.read()

        # Validate file size
        is_valid_size, size_message = self.validate_file_size(content)
        if not is_valid_size:
            raise HTTPException(status_code=413, detail=size_message)

        # Save file to disk
        file_path, unique_filename = await self.save_file(file, content)

        # Create database record
        document = self.create_document_record(
            db=db,
            user=user,
            file=file,
            file_path=file_path,
            file_size=len(content),
            title=title,
            description=description,
            category=category,
            tags=tags
        )

        return document


# Create global instance
document_controller = DocumentController()