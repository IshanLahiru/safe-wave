import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App settings
    app_name: str = "Safe Wave API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # JWT settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Database settings (for future use)
    database_url: Optional[str] = None
    
    # CORS settings
    allowed_origins: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()
