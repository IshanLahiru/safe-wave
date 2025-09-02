from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AudioBase(BaseModel):
    description: Optional[str] = None
    mood_rating: Optional[int] = None
    tags: Optional[List[str]] = None

class AudioCreate(AudioBase):
    pass

class AudioUpdate(BaseModel):
    description: Optional[str] = None
    mood_rating: Optional[int] = None
    tags: Optional[List[str]] = None
    transcription: Optional[str] = None
    transcription_confidence: Optional[float] = None
    transcription_status: Optional[str] = None
    analysis_status: Optional[str] = None
    risk_level: Optional[str] = None
    mental_health_indicators: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None

class AudioResponse(AudioBase):
    id: int
    userId: int
    filename: str
    filePath: str
    fileSize: int
    duration: Optional[float] = None
    contentType: str
    transcription: Optional[str] = None
    transcriptionConfidence: Optional[float] = None
    transcriptionStatus: str
    analysisStatus: str
    riskLevel: Optional[str] = None
    mentalHealthIndicators: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None
    createdAt: str
    updatedAt: Optional[str] = None
    transcribedAt: Optional[str] = None
    analyzedAt: Optional[str] = None

    class Config:
        from_attributes = True

class AudioTranscriptionRequest(BaseModel):
    audio_id: int

class AudioAnalysisRequest(BaseModel):
    audio_id: int
