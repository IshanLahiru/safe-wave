from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class DocumentBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    content: Optional[str] = None
    transcription_status: Optional[str] = None
    transcription_confidence: Optional[float] = None
    analysis_status: Optional[str] = None
    risk_level: Optional[str] = None
    mental_health_indicators: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    filename: str
    file_path: str
    file_size: int
    content_type: str
    content: Optional[str] = None
    transcription_status: str
    transcription_confidence: Optional[float] = None
    analysis_status: str
    risk_level: Optional[str] = None
    mental_health_indicators: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentProcessingRequest(BaseModel):
    document_id: int


class DocumentAnalysisRequest(BaseModel):
    document_id: int
