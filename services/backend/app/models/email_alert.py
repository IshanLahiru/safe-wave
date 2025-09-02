from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EmailAlert(Base):
    """
    Email alerts table to track all email notifications sent to care persons and emergency contacts.
    
    This replaces the audio_analysis table and provides a centralized way to track
    all email communications related to mental health alerts.
    """
    __tablename__ = "email_alerts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    audio_id = Column(Integer, ForeignKey("audios.id"), nullable=True, index=True)  # Optional - for audio-related alerts
    
    # Alert details
    alert_type = Column(String, nullable=False, index=True)  # 'immediate_voice', 'onboarding_analysis', 'critical_risk', 'daily_summary'
    recipient_email = Column(String, nullable=False, index=True)
    recipient_type = Column(String, nullable=False)  # 'care_person', 'emergency_contact'
    
    # Email content
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    
    # Alert metadata
    risk_level = Column(String, nullable=True, index=True)  # 'low', 'medium', 'high', 'critical'
    urgency_level = Column(String, nullable=True)  # 'low', 'medium', 'high', 'immediate'
    
    # Analysis data (JSON format for flexibility)
    analysis_data = Column(JSON, nullable=True)  # Stores analysis results, recommendations, etc.
    
    # Transcription (if audio-related)
    transcription = Column(Text, nullable=True)
    transcription_confidence = Column(Integer, nullable=True)  # 0-100
    
    # Email status
    sent_successfully = Column(Boolean, default=False, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Retry information
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="email_alerts")
    audio = relationship("Audio", back_populates="email_alerts")
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "audio_id": self.audio_id,
            "alert_type": self.alert_type,
            "recipient_email": self.recipient_email,
            "recipient_type": self.recipient_type,
            "subject": self.subject,
            "risk_level": self.risk_level,
            "urgency_level": self.urgency_level,
            "analysis_data": self.analysis_data,
            "transcription": self.transcription,
            "transcription_confidence": self.transcription_confidence,
            "sent_successfully": self.sent_successfully,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f"<EmailAlert(id={self.id}, type={self.alert_type}, user_id={self.user_id}, sent={self.sent_successfully})>"
