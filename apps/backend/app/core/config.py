from pydantic_settings import BaseSettings
from typing import Optional
import secrets
import os

class Settings(BaseSettings):
    # Database Configuration
    POSTGRES_DB: str = "safewave"
    POSTGRES_USER: str = "user"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_PORT: int = 5433
    DATABASE_URL: str = "postgresql://user:password@localhost:5433/safewave"
    
    # JWT
    SECRET_KEY: str = secrets.token_urlsafe(32)  # Generate secure random key if not provided
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes for security
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days for refresh tokens
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Safe Wave API"
    HOST: str = "0.0.0.0"
    PORT: int = 9000
    API_PORT: int = 9000  # For docker-compose compatibility
    
    # OpenAI (Legacy - being replaced by OpenRouter)
    OPENAI_API_KEY: Optional[str] = None
    USE_LOCAL_MODELS: bool = False  # Use local models if available (free)
    COST_OPTIMIZATION: bool = True   # Enable cost optimization features
    
    # OpenRouter Configuration (Primary LLM provider)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"  # Default model (free tier)
    OPENROUTER_MAX_TOKENS: int = 1000
    OPENROUTER_TEMPERATURE: float = 0.3
    
    # SMTP Email Settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@safewave.com"
    
    # Local File Storage Configuration
    UPLOAD_BASE_DIR: str = "uploads"
    AUDIO_UPLOAD_DIR: str = "uploads/audio"
    DOCUMENT_UPLOAD_DIR: str = "uploads/documents"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_AUDIO_FORMATS: list = ["mp3", "wav", "m4a", "aac", "ogg", "flac", "webm"]
    ALLOWED_DOCUMENT_FORMATS: list = ["pdf", "doc", "docx", "txt", "rtf"]
    
    # Audio Processing
    AUDIO_CHUNK_SIZE: int = 8192  # Bytes per chunk for streaming
    ENABLE_AUDIO_STREAMING: bool = True
    ENABLE_TRANSCRIPTION: bool = True
    ENABLE_LLM_ANALYSIS: bool = True
    
    class Config:
        env_file = [".env.local", ".env"]
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Handle old default values gracefully
        if self.SECRET_KEY == "your-secret-key-change-in-production":
            print("⚠️  WARNING: Using default SECRET_KEY. Please set a secure value in production!")
            self.SECRET_KEY = secrets.token_urlsafe(32)
            print("✅ Generated new secure SECRET_KEY")
        
        # Generate a secure secret key if none provided
        if not self.SECRET_KEY or self.SECRET_KEY == secrets.token_urlsafe(32):
            self.SECRET_KEY = secrets.token_urlsafe(32)
            print("⚠️  WARNING: Generated new SECRET_KEY. This will invalidate all existing tokens!")

settings = Settings()
