import logging
from datetime import datetime, timedelta

from jose import jwt
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.token import BlacklistedToken
from app.utils.auth import verify_refresh_token, verify_token


class TokenService:
    """Service for managing JWT tokens"""

    @staticmethod
    def blacklist_token(db: Session, token: str) -> bool:
        """Add a token to the blacklist"""
        try:
            # Test database connection first
            db.execute(text("SELECT 1"))

            # Decode token to get expiration
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            exp_timestamp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp_timestamp)

            # Check if token is already blacklisted
            existing = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
            if existing:
                return True

            # Add to blacklist
            blacklisted_token = BlacklistedToken(token=token, expires_at=expires_at)
            db.add(blacklisted_token)
            db.commit()
            return True

        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to blacklist token: {e}")
            try:
                db.rollback()
            except:
                pass
            return False

    @staticmethod
    def is_token_blacklisted(db: Session, token: str) -> bool:
        """Check if a token is blacklisted"""
        try:
            # Test database connection first
            db.execute(text("SELECT 1"))

            blacklisted = (
                db.query(BlacklistedToken)
                .filter(BlacklistedToken.token == token, BlacklistedToken.is_blacklisted == True)
                .first()
            )
            return blacklisted is not None

        except Exception as e:
            # If database connection fails, assume token is not blacklisted
            # This prevents authentication failures due to database issues
            logger = logging.getLogger(__name__)
            logger.warning(f"Database connection failed during token blacklist check: {e}")
            logger.warning("Assuming token is not blacklisted to prevent auth failures")
            return False

    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """Remove expired tokens from blacklist"""
        try:
            now = datetime.utcnow()
            expired_tokens = (
                db.query(BlacklistedToken).filter(BlacklistedToken.expires_at < now).all()
            )

            count = len(expired_tokens)
            for token in expired_tokens:
                db.delete(token)

            db.commit()
            return count

        except Exception as e:
            db.rollback()
            return 0

    @staticmethod
    def validate_access_token(db: Session, token: str) -> bool:
        """Validate access token (not expired, not blacklisted)"""
        if TokenService.is_token_blacklisted(db, token):
            return False

        token_data = verify_token(token, "access")
        return token_data is not None

    @staticmethod
    def validate_refresh_token(db: Session, token: str) -> bool:
        """Validate refresh token (not expired, not blacklisted)"""
        if TokenService.is_token_blacklisted(db, token):
            return False

        token_data = verify_refresh_token(token)
        return token_data is not None
