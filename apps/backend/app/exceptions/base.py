"""
Base exception classes for Safe Wave backend.
These provide clear, human-friendly error messages.
"""

from typing import Optional, Dict, Any


class SafeWaveException(Exception):
    """Base exception for all Safe Wave errors"""
    
    def __init__(
        self, 
        message: str, 
        code: str = "UNKNOWN_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ConfigurationError(SafeWaveException):
    """Raised when there's a configuration issue"""
    
    def __init__(self, message: str, missing_config: Optional[str] = None):
        details = {"missing_config": missing_config} if missing_config else {}
        super().__init__(
            message=message,
            code="CONFIGURATION_ERROR", 
            details=details
        )


class EmailServiceError(SafeWaveException):
    """Raised when email service fails"""
    
    def __init__(self, message: str, recipient: Optional[str] = None):
        details = {"recipient": recipient} if recipient else {}
        super().__init__(
            message=message,
            code="EMAIL_SERVICE_ERROR",
            details=details
        )


class AnalysisServiceError(SafeWaveException):
    """Raised when analysis service fails"""
    
    def __init__(self, message: str, service_type: Optional[str] = None):
        details = {"service_type": service_type} if service_type else {}
        super().__init__(
            message=message,
            code="ANALYSIS_SERVICE_ERROR",
            details=details
        )


class AudioProcessingError(SafeWaveException):
    """Raised when audio processing fails"""
    
    def __init__(self, message: str, audio_id: Optional[int] = None):
        details = {"audio_id": audio_id} if audio_id else {}
        super().__init__(
            message=message,
            code="AUDIO_PROCESSING_ERROR",
            details=details
        )


class UserDataError(SafeWaveException):
    """Raised when user data is missing or invalid"""
    
    def __init__(self, message: str, user_id: Optional[int] = None, missing_field: Optional[str] = None):
        details = {}
        if user_id:
            details["user_id"] = user_id
        if missing_field:
            details["missing_field"] = missing_field
            
        super().__init__(
            message=message,
            code="USER_DATA_ERROR",
            details=details
        )
