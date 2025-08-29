from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AudioUploadRequest(BaseModel):
    """Request schema for audio upload"""
    description: Optional[str] = None
    mood_rating: Optional[int] = None  # 1-10 scale

class AudioAnalysisResponse(BaseModel):
    """Response schema for audio analysis"""
    id: int
    userId: int
    audioFilePath: str
    audioDuration: Optional[int] = None
    fileSize: Optional[int] = None
    transcription: Optional[str] = None
    transcriptionConfidence: Optional[int] = None
    llmAnalysis: Optional[Dict[str, Any]] = None
    riskLevel: Optional[str] = None
    mentalHealthIndicators: Optional[Dict[str, Any]] = None
    alertSent: bool
    alertSentAt: Optional[str] = None
    carePersonNotified: bool
    createdAt: str
    analyzedAt: Optional[str] = None

class AudioAnalysisCreate(BaseModel):
    """Schema for creating audio analysis"""
    user_id: int
    audio_file_path: str
    audio_duration: Optional[int] = None
    file_size: Optional[int] = None

class AudioAnalysisUpdate(BaseModel):
    """Schema for updating audio analysis"""
    transcription: Optional[str] = None
    transcription_confidence: Optional[int] = None
    llm_analysis: Optional[Dict[str, Any]] = None
    risk_level: Optional[str] = None
    mental_health_indicators: Optional[Dict[str, Any]] = None
    alert_sent: Optional[bool] = None
    alert_sent_at: Optional[datetime] = None
    care_person_notified: Optional[bool] = None
    analyzed_at: Optional[datetime] = None

class LLMAnalysisResult(BaseModel):
    """Schema for LLM analysis results"""
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    mental_health_indicators: Dict[str, Any]
    summary: str
    recommendations: list[str]
    requires_immediate_attention: bool
    care_person_alert: bool
    alert_message: Optional[str] = None
