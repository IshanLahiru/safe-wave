from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Audio(Base):
    __tablename__ = "audios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    duration = Column(Float, nullable=True)  # Duration in seconds
    content_type = Column(String, nullable=False)
    
    # Transcription
    transcription = Column(Text, nullable=True)
    transcription_confidence = Column(Float, nullable=True)
    transcription_status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Analysis
    analysis_status = Column(String, default="pending")  # pending, processing, completed, failed
    risk_level = Column(String, nullable=True)  # low, medium, high, critical
    mental_health_indicators = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # Metadata
    description = Column(String, nullable=True)
    mood_rating = Column(Integer, nullable=True)
    tags = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    transcribed_at = Column(DateTime(timezone=True), nullable=True)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audios")
    
    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "filename": self.filename,
            "filePath": self.file_path,
            "fileSize": self.file_size,
            "duration": self.duration,
            "contentType": self.content_type,
            "transcription": self.transcription,
            "transcriptionConfidence": self.transcription_confidence,
            "transcriptionStatus": self.transcription_status,
            "analysisStatus": self.analysis_status,
            "riskLevel": self.risk_level,
            "mentalHealthIndicators": self.mental_health_indicators,
            "summary": self.summary,
            "recommendations": self.recommendations,
            "description": self.description,
            "moodRating": self.mood_rating,
            "tags": self.tags,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "transcribedAt": self.transcribed_at.isoformat() if self.transcribed_at else None,
            "analyzedAt": self.analyzed_at.isoformat() if self.analyzed_at else None
        }
