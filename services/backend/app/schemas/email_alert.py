from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


class EmailAlertBase(BaseModel):
    """Base schema for email alerts."""
    alert_type: str
    recipient_email: EmailStr
    recipient_type: str
    subject: str
    risk_level: Optional[str] = None
    urgency_level: Optional[str] = None


class EmailAlertCreate(EmailAlertBase):
    """Schema for creating email alerts."""
    user_id: int
    audio_id: Optional[int] = None
    body: str
    analysis_data: Optional[Dict[str, Any]] = None
    transcription: Optional[str] = None
    transcription_confidence: Optional[int] = None


class EmailAlertUpdate(BaseModel):
    """Schema for updating email alerts."""
    sent_successfully: Optional[bool] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None


class EmailAlertResponse(BaseModel):
    """Schema for email alert responses."""
    id: int
    user_id: int
    audio_id: Optional[int] = None
    alert_type: str
    recipient_email: str
    recipient_type: str
    subject: str
    risk_level: Optional[str] = None
    urgency_level: Optional[str] = None
    analysis_data: Optional[Dict[str, Any]] = None
    transcription: Optional[str] = None
    transcription_confidence: Optional[int] = None
    sent_successfully: bool
    sent_at: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    max_retries: int
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class EmailAlertListResponse(BaseModel):
    """Schema for listing email alerts."""
    alerts: List[EmailAlertResponse]
    total: int
    page: int
    per_page: int


class EmailAlertStatsResponse(BaseModel):
    """Schema for email alert statistics."""
    total_alerts: int
    successful_alerts: int
    failed_alerts: int
    pending_retries: int
    alert_types: Dict[str, int]
    recent_alerts: List[EmailAlertResponse]
