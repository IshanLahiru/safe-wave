import os
import secrets
import sys
from typing import Optional, List
from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, model_validator, AliasChoices


class Settings(BaseSettings):
    """
    Application settings with environment variable support.

    All sensitive values (passwords, API keys, secrets) must be provided via environment variables.
    Non-sensitive values have reasonable defaults but can be overridden.
    """

    # ===== DATABASE CONFIGURATION =====
    # Database connection details - REQUIRED in production
    POSTGRES_DB: str = Field(
        default="safewave",
        description="PostgreSQL database name"
    )
    POSTGRES_USER: str = Field(
        default="user",
        description="PostgreSQL username"
    )
    POSTGRES_PASSWORD: str = Field(
        ...,  # Required, no default for security
        description="PostgreSQL password - REQUIRED"
    )
    POSTGRES_HOST: str = Field(
        default="localhost",
        description="PostgreSQL host address"
    )
    POSTGRES_PORT: int = Field(
        default=5432,
        description="PostgreSQL port number"
    )

    # Constructed from individual components or provided directly
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="Complete database URL - if not provided, will be constructed from individual components"
    )

    # ===== JWT CONFIGURATION =====
    # JWT secret key - REQUIRED and must be secure
    SECRET_KEY: str = Field(
        ...,  # Required, no default for security
        description="JWT secret key - REQUIRED, must be cryptographically secure"
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="JWT algorithm"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        description="Access token expiration time in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="Refresh token expiration time in days"
    )

    # ===== API CONFIGURATION =====
    API_V1_STR: str = Field(
        default="/api/v1",
        description="API version 1 prefix"
    )
    PROJECT_NAME: str = Field(
        default="Safe Wave API",
        description="Project name for documentation"
    )
    HOST: str = Field(
        default="0.0.0.0",
        description="Host address to bind the server"
    )
    PORT: int = Field(
        default=8000,
        description="Port number for the API server"
    )
    API_PORT: int = Field(
        default=9000,
        description="API port for docker-compose compatibility"
    )

    # Environment and debug settings
    ENVIRONMENT: str = Field(
        default="development",
        description="Environment: development, staging, production"
    )
    DEBUG: bool = Field(
        default=False,
        description="Enable debug mode - should be False in production"
    )

    # ===== CORS CONFIGURATION =====
    CORS_ORIGINS: str = Field(
        default="http://localhost:19006,http://localhost:8081,http://localhost:3000",
        description="Allowed CORS origins - comma-separated list, update for production domains",
        validation_alias=AliasChoices("BACKEND_CORS_ORIGINS", "CORS_ORIGINS"),
    )

    # ===== AI/LLM CONFIGURATION =====
    # OpenAI (Legacy - being replaced by OpenRouter)
    OPENAI_API_KEY: Optional[str] = Field(
        default=None,
        description="OpenAI API key - optional, legacy support"
    )
    USE_LOCAL_MODELS: bool = Field(
        default=False,
        description="Use local models if available (free)"
    )
    COST_OPTIMIZATION: bool = Field(
        default=True,
        description="Enable cost optimization features"
    )

    # OpenRouter Configuration (Primary LLM provider)
    OPENROUTER_API_KEY: Optional[str] = Field(
        default=None,
        description="OpenRouter API key - required for LLM features"
    )
    OPENROUTER_BASE_URL: str = Field(
        default="https://openrouter.ai/api/v1",
        description="OpenRouter API base URL"
    )
    OPENROUTER_MODEL: str = Field(
        default="openai/gpt-3.5-turbo",
        description="Default OpenRouter model (free tier available)"
    )
    OPENROUTER_MAX_TOKENS: int = Field(
        default=1000,
        description="Maximum tokens for OpenRouter requests"
    )
    OPENROUTER_TEMPERATURE: float = Field(
        default=0.3,
        description="Temperature for OpenRouter requests (0.0-1.0)"
    )

    # ===== EMAIL CONFIGURATION =====
    # SMTP settings - required for email functionality
    SMTP_SERVER: str = Field(
        default="smtp.gmail.com",
        description="SMTP server hostname"
    )
    SMTP_PORT: int = Field(
        default=587,
        description="SMTP server port (587 for TLS, 465 for SSL)"
    )
    SMTP_USERNAME: Optional[str] = Field(
        default=None,
        description="SMTP username - required for email functionality"
    )
    SMTP_PASSWORD: Optional[str] = Field(
        default=None,
        description="SMTP password or app password - required for email functionality"
    )
    FROM_EMAIL: str = Field(
        default="noreply@safewave.com",
        description="Default from email address"
    )
    SMTP_USE_TLS: bool = Field(
        default=True,
        description="Use TLS for SMTP connection"
    )

    # ===== FILE STORAGE CONFIGURATION =====
    # Local file storage paths
    UPLOAD_BASE_DIR: str = Field(
        default="uploads",
        description="Base directory for file uploads"
    )
    AUDIO_UPLOAD_DIR: str = Field(
        default="uploads/audio",
        description="Directory for audio file uploads"
    )
    DOCUMENT_UPLOAD_DIR: str = Field(
        default="uploads/documents",
        description="Directory for document uploads"
    )

    # File size and format restrictions
    MAX_FILE_SIZE: int = Field(
        default=100 * 1024 * 1024,  # 100MB
        description="Maximum file size in bytes"
    )
    ALLOWED_AUDIO_FORMATS: List[str] = Field(
        default=["mp3", "wav", "m4a", "aac", "ogg", "flac", "webm"],
        description="Allowed audio file formats"
    )
    ALLOWED_DOCUMENT_FORMATS: List[str] = Field(
        default=["pdf", "doc", "docx", "txt", "rtf"],
        description="Allowed document file formats"
    )

    # ===== AUDIO PROCESSING CONFIGURATION =====
    AUDIO_CHUNK_SIZE: int = Field(
        default=8192,
        description="Bytes per chunk for audio streaming"
    )
    ENABLE_AUDIO_STREAMING: bool = Field(
        default=True,
        description="Enable real-time audio streaming"
    )
    ENABLE_TRANSCRIPTION: bool = Field(
        default=True,
        description="Enable audio transcription features"
    )
    ENABLE_LLM_ANALYSIS: bool = Field(
        default=True,
        description="Enable LLM analysis of transcriptions"
    )

    # ===== SECURITY CONFIGURATION =====
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60,
        description="API rate limit per minute per IP"
    )

    # Session security
    SESSION_TIMEOUT_MINUTES: int = Field(
        default=30,
        description="Session timeout in minutes"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v):
        """Validate that SECRET_KEY is secure and not a default value."""
        if not v:
            raise ValueError("SECRET_KEY is required and cannot be empty")

        # Check for common insecure values
        insecure_values = [
            "your-secret-key-change-in-production",
            "dev_jwt_key_change_in_production_minimum_32_chars",
            "secret",
            "password",
            "123456",
            "changeme"
        ]

        if v.lower() in [val.lower() for val in insecure_values]:
            raise ValueError(f"SECRET_KEY cannot be a default or insecure value: {v}")

        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")

        return v

    @field_validator('POSTGRES_PASSWORD')
    @classmethod
    def validate_postgres_password(cls, v):
        """Validate PostgreSQL password."""
        if not v:
            raise ValueError("POSTGRES_PASSWORD is required")
        if len(v) < 8:
            raise ValueError("POSTGRES_PASSWORD must be at least 8 characters long")
        return v

    @model_validator(mode='before')
    @classmethod
    def construct_database_url(cls, values):
        """
        Construct DATABASE_URL with environment-aware host and port detection.
        Handles Docker internal networking vs local development scenarios.
        """
        if isinstance(values, dict):
            database_url = values.get('DATABASE_URL')
            if database_url:
                return values

            # Get basic connection components
            user = values.get('POSTGRES_USER', 'user')
            password = values.get('POSTGRES_PASSWORD')
            db = values.get('POSTGRES_DB', 'safewave')
            
            if not password:
                return values

            # Environment-aware host and port configuration
            environment = values.get('ENVIRONMENT', 'development').lower()
            
            # Detect if running in Docker
            is_docker = (
                os.path.exists('/.dockerenv') or
                os.environ.get('DOCKER_CONTAINER') or
                os.environ.get('POSTGRES_HOST') == 'db'
            )
            
            if is_docker:
                # Docker internal networking
                host = 'db'
                port = 5432
                print(f"🐳 Docker environment detected - using internal networking: {host}:{port}")
            else:
                # Local development or production with external access
                host = values.get('POSTGRES_HOST', 'localhost')
                port = values.get('POSTGRES_PORT', 5433)
                print(f"🏠 Local/Production environment - using external access: {host}:{port}")

            database_url = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{db}"
            values['DATABASE_URL'] = database_url
            
            # Log database configuration (without password)
            print(f"🔧 Constructed DATABASE_URL: postgresql://{user}:***@{host}:{port}/{db}")

        return values

    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v):
        """Validate environment setting."""
        allowed_envs = ['development', 'staging', 'production']
        if v.lower() not in allowed_envs:
            raise ValueError(f"ENVIRONMENT must be one of: {allowed_envs}")
        return v.lower()

    @field_validator('CORS_ORIGINS')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string to list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    def get_cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
        return self.CORS_ORIGINS

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Create upload directories if they don't exist
        self._create_upload_directories()

        # Validate production settings
        if self.ENVIRONMENT == 'production':
            self._validate_production_settings()

        # Print configuration summary (without sensitive values)
        self._print_config_summary()

    def _create_upload_directories(self):
        """Create upload directories if they don't exist."""
        directories = [
            self.UPLOAD_BASE_DIR,
            self.AUDIO_UPLOAD_DIR,
            self.DOCUMENT_UPLOAD_DIR
        ]

        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)

    def _validate_production_settings(self):
        """Validate critical settings for production environment."""
        errors = []

        # Check that debug is disabled
        if self.DEBUG:
            errors.append("DEBUG must be False in production")

        # Check that sensitive values are not defaults
        if not self.SMTP_USERNAME and not self.SMTP_PASSWORD:
            print("⚠️  WARNING: Email functionality disabled - SMTP credentials not configured")

        if not self.OPENROUTER_API_KEY and not self.OPENAI_API_KEY:
            print("⚠️  WARNING: LLM functionality disabled - No AI API keys configured")

        # Check CORS origins for production
        localhost_origins = [origin for origin in self.CORS_ORIGINS if 'localhost' in origin]
        if localhost_origins:
            print(f"⚠️  WARNING: Localhost CORS origins in production: {localhost_origins}")

        if errors:
            raise ValueError(
                f"Production validation failed: {'; '.join(errors)}"
            )

    def _print_config_summary(self):
        """Print configuration summary without sensitive information."""
        print("🔧 Safe Wave API Configuration:")
        print(f"   Environment: {self.ENVIRONMENT}")
        print(f"   Debug Mode: {self.DEBUG}")
        print(f"   API Port: {self.PORT}")
        print(
            f"   Database: {self.POSTGRES_DB}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}"
        )
        print(f"   Upload Directory: {self.UPLOAD_BASE_DIR}")
        print(f"   CORS Origins: {len(self.CORS_ORIGINS)} configured")

        # Feature availability
        features = []
        if self.SMTP_USERNAME and self.SMTP_PASSWORD:
            features.append("Email")
        if self.OPENROUTER_API_KEY or self.OPENAI_API_KEY:
            features.append("LLM Analysis")
        if self.ENABLE_TRANSCRIPTION:
            features.append("Audio Transcription")

        features_str = (
            ', '.join(features) if features else 'Basic functionality only'
        )
        print(f"   Features: {features_str}")


    def validate_database_connection(self, max_retries: int = 3) -> bool:
        """
        Validate database connection with retry logic and exponential backoff.
        
        Args:
            max_retries: Maximum number of retry attempts
            
        Returns:
            bool: True if connection successful, False otherwise
        """
        import time
        from sqlalchemy import create_engine, text, pool
        
        for attempt in range(max_retries):
            try:
                # Create a test engine with minimal configuration
                test_engine = create_engine(
                    self.DATABASE_URL,
                    poolclass=pool.NullPool,
                    connect_args={
                        'connect_timeout': 10,
                        'application_name': 'safewave_health_check'
                    }
                )
                
                # Test connection with a simple query
                with test_engine.connect() as conn:
                    result = conn.execute(text("SELECT 1 as health_check"))
                    result.fetchone()
                    
                print(f"✅ Database connection validated successfully")
                test_engine.dispose()
                return True
                
            except Exception as e:
                print(f"⚠️  Database connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    print(f"🕐 Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    print("❌ All database connection attempts failed")
                    
        return False
    
    def get_database_info(self) -> dict:
        """
        Get database connection information for diagnostics.
        
        Returns:
            dict: Database connection details (without sensitive info)
        """
        if not self.DATABASE_URL:
            return {"status": "not_configured", "error": "DATABASE_URL not set"}
            
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.DATABASE_URL)
            
            return {
                "status": "configured",
                "host": parsed.hostname or "unknown",
                "port": parsed.port or "unknown",
                "database": parsed.path.lstrip('/') if parsed.path else "unknown",
                "username": parsed.username or "unknown",
                "scheme": parsed.scheme or "unknown"
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def validate_configuration_consistency(self) -> List[str]:
        """
        Validate configuration consistency across different deployment scenarios.
        
        Returns:
            List[str]: List of configuration warnings/errors
        """
        issues = []
        
        # Check port consistency
        if hasattr(self, 'POSTGRES_PORT'):
            expected_port = 5433  # Standard external port
            if self.POSTGRES_PORT != expected_port:
                issues.append(
                    f"Port mismatch: POSTGRES_PORT is {self.POSTGRES_PORT}, "
                    f"expected {expected_port} for external access"
                )
        
        # Check Docker vs local configuration alignment
        db_info = self.get_database_info()
        if db_info["status"] == "configured":
            host = db_info["host"]
            port = db_info["port"]
            
            # Detect Docker environment
            is_docker = (
                os.path.exists('/.dockerenv') or
                os.environ.get('DOCKER_CONTAINER') or
                host == 'postgres'
            )
            
            if is_docker and port != 5432:
                issues.append(
                    f"Docker configuration: Using port {port}, "
                    f"but Docker internal should use 5432"
                )
            elif not is_docker and port == 5432:
                issues.append(
                    f"Local configuration: Using port {port}, "
                    f"but local development should use 5433"
                )
        
        # Check production readiness
        if self.ENVIRONMENT == 'production':
            if 'localhost' in str(self.DATABASE_URL):
                issues.append(
                    "Production environment using localhost database - "
                    "consider using a managed database service"
                )
                
        return issues


def get_settings() -> Settings:
    """Get application settings with comprehensive error handling and validation."""
    try:
        settings_instance = Settings()
        
        # Validate configuration consistency
        config_issues = settings_instance.validate_configuration_consistency()
        if config_issues:
            print("⚠️  Configuration warnings:")
            for issue in config_issues:
                print(f"   - {issue}")
        
        # Validate database connection if not in test mode
        if not os.environ.get('TESTING'):
            print("🔍 Validating database connection...")
            if not settings_instance.validate_database_connection(max_retries=1):
                print("⚠️  Database connection validation failed")
                print("💡 The application will start, but database operations may fail")
        
        return settings_instance
        
    except Exception as e:
        print(f"❌ Configuration Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check your environment variables and .env file")
        print("   2. Verify database credentials are correct")
        print("   3. Ensure database server is running and accessible")
        print("   4. See .env.example for required variables")
        
        # In development, provide more helpful debug info
        if os.environ.get('DEBUG', '').lower() == 'true':
            print(f"\n🐛 Debug info: {type(e).__name__}: {e}")
            
        sys.exit(1)


# Global settings instance
settings = get_settings()
