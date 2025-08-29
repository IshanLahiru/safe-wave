from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/safewave"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes for security
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days for refresh tokens
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Safe Wave API"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # SMTP Email Settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@safewave.com"
    
    # File Upload
    UPLOAD_DIR: str = "uploads/audio"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_AUDIO_FORMATS: list = ["mp3", "wav", "m4a", "aac"]
    
    class Config:
        env_file = ".env"

settings = Settings()
