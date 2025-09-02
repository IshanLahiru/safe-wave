"""
Configuration validator to ensure all required settings are properly configured.
Provides human-friendly error messages when configuration is missing.
"""

import logging
from typing import List, Dict, Any
from app.core.config import settings
from app.exceptions.base import ConfigurationError

logger = logging.getLogger(__name__)


class ConfigValidator:
    """Validates application configuration and provides helpful error messages"""
    
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate_all(self) -> Dict[str, Any]:
        """
        Validate all configuration settings.
        
        Returns:
            Dict with validation results and helpful messages
        """
        self.errors.clear()
        self.warnings.clear()
        
        # Validate different configuration sections
        self._validate_database_config()
        self._validate_email_config()
        self._validate_llm_config()
        self._validate_security_config()
        
        # Prepare results
        is_valid = len(self.errors) == 0
        
        result = {
            "is_valid": is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "summary": self._generate_summary()
        }
        
        # Log results
        if is_valid:
            logger.info("✅ Configuration validation passed")
            if self.warnings:
                logger.warning(f"⚠️ {len(self.warnings)} configuration warnings found")
        else:
            logger.error(f"❌ Configuration validation failed with {len(self.errors)} errors")
        
        return result
    
    def _validate_database_config(self):
        """Validate database configuration"""
        if not settings.DATABASE_URL:
            self.errors.append(
                "Database connection string is missing. "
                "Please set DATABASE_URL in your environment file."
            )
        
        if not settings.POSTGRES_DB:
            self.warnings.append("Database name not specified, using default 'safewave'")
    
    def _validate_email_config(self):
        """Validate email configuration"""
        required_email_fields = {
            "SMTP_SERVER": settings.SMTP_SERVER,
            "SMTP_USERNAME": settings.SMTP_USERNAME,
            "SMTP_PASSWORD": settings.SMTP_PASSWORD,
            "FROM_EMAIL": settings.FROM_EMAIL
        }
        
        missing_email_fields = [
            field for field, value in required_email_fields.items() 
            if not value
        ]
        
        if missing_email_fields:
            self.errors.append(
                f"Email service is not configured properly. Missing: {', '.join(missing_email_fields)}. "
                "Email notifications won't work until these are set. "
                "Check the SMTP_SETUP_GUIDE.md for help."
            )
        
        # Check SMTP port
        if settings.SMTP_PORT not in [587, 465, 25]:
            self.warnings.append(
                f"SMTP port {settings.SMTP_PORT} is unusual. "
                "Common ports are 587 (TLS), 465 (SSL), or 25 (plain)."
            )
    
    def _validate_llm_config(self):
        """Validate LLM service configuration"""
        has_openrouter = bool(settings.OPENROUTER_API_KEY)
        has_openai = bool(settings.OPENAI_API_KEY)
        
        if not has_openrouter and not has_openai:
            self.warnings.append(
                "No LLM service configured (OpenRouter or OpenAI). "
                "The app will use mock analysis for testing. "
                "For production, please configure at least one LLM service."
            )
        elif has_openrouter and has_openai:
            logger.info("✅ Both OpenRouter and OpenAI configured (OpenRouter will be preferred)")
        elif has_openrouter:
            logger.info("✅ OpenRouter configured for LLM analysis")
        elif has_openai:
            logger.info("✅ OpenAI configured for LLM analysis")
    
    def _validate_security_config(self):
        """Validate security configuration"""
        if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
            self.errors.append(
                "JWT secret key is too short or missing. "
                "Please set a strong SECRET_KEY (at least 32 characters) for security."
            )
        
        if settings.ACCESS_TOKEN_EXPIRE_MINUTES > 60:
            self.warnings.append(
                f"Access token expiry is set to {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes. "
                "Consider using shorter expiry times (15-30 minutes) for better security."
            )
    
    def _generate_summary(self) -> str:
        """Generate a human-friendly summary of the validation results"""
        if not self.errors and not self.warnings:
            return "🎉 All configuration looks good! The app should work properly."
        
        summary_parts = []
        
        if self.errors:
            summary_parts.append(
                f"❌ {len(self.errors)} critical issue(s) found that will prevent the app from working properly."
            )
        
        if self.warnings:
            summary_parts.append(
                f"⚠️ {len(self.warnings)} warning(s) found. The app will work but some features might be limited."
            )
        
        return " ".join(summary_parts)
    
    def validate_email_service(self) -> bool:
        """Quick check if email service is properly configured"""
        required_fields = [
            settings.SMTP_SERVER,
            settings.SMTP_USERNAME, 
            settings.SMTP_PASSWORD,
            settings.FROM_EMAIL
        ]
        return all(required_fields)
    
    def validate_llm_service(self) -> bool:
        """Quick check if at least one LLM service is configured"""
        return bool(settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY)


# Global instance
config_validator = ConfigValidator()


def get_config_status() -> Dict[str, Any]:
    """Get current configuration status - useful for health checks"""
    return config_validator.validate_all()
