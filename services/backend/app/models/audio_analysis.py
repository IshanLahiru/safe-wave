from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AudioAnalysis(Base):
    __tablename__ = "audio_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Audio file information
    audio_file_path = Column(String, nullable=False)
    audio_duration = Column(Integer)  # Duration in seconds
    file_size = Column(Integer)  # File size in bytes

    # Transcription
    transcription = Column(Text)
    transcription_confidence = Column(Integer)  # 0-100

    # AI Analysis
    llm_analysis = Column(JSON)  # Structured analysis results
    risk_level = Column(String)  # 'low', 'medium', 'high', 'critical'
    mental_health_indicators = Column(JSON)  # Specific indicators found

    # Alert information
    alert_sent = Column(Boolean, default=False)
    alert_sent_at = Column(DateTime(timezone=True))
    care_person_notified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    analyzed_at = Column(DateTime(timezone=True))

    # Relationships
    # user = relationship("User", back_populates="audio_analyses")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "audioFilePath": self.audio_file_path,
            "audioDuration": self.audio_duration,
            "fileSize": self.file_size,
            "transcription": self.transcription,
            "transcriptionConfidence": self.transcription_confidence,
            "llmAnalysis": self.llm_analysis,
            "riskLevel": self.risk_level,
            "mentalHealthIndicators": self.mental_health_indicators,
            "alertSent": self.alert_sent,
            "alertSentAt": self.alert_sent_at.isoformat() if self.alert_sent_at else None,
            "carePersonNotified": self.care_person_notified,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "analyzedAt": self.analyzed_at.isoformat() if self.analyzed_at else None,
        }
