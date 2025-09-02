from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    
    # Content and Transcription
    content = Column(Text, nullable=True)  # Extracted text content
    transcription_status = Column(String, default="pending")  # pending, processing, completed, failed
    transcription_confidence = Column(Float, nullable=True)
    
    # Analysis
    analysis_status = Column(String, default="pending")  # pending, processing, completed, failed
    risk_level = Column(String, nullable=True)  # low, medium, high, critical
    mental_health_indicators = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # Metadata
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)  # journal, note, report, etc.
    tags = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    
    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "filename": self.filename,
            "filePath": self.file_path,
            "fileSize": self.file_size,
            "contentType": self.content_type,
            "content": self.content,
            "transcriptionStatus": self.transcription_status,
            "transcriptionConfidence": self.transcription_confidence,
            "analysisStatus": self.analysis_status,
            "riskLevel": self.risk_level,
            "mentalHealthIndicators": self.mental_health_indicators,
            "summary": self.summary,
            "recommendations": self.recommendations,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "tags": self.tags,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "processedAt": self.processed_at.isoformat() if self.processed_at else None,
            "analyzedAt": self.analyzed_at.isoformat() if self.analyzed_at else None
        }
