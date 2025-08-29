from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.token import BlacklistedToken
from app.utils.auth import verify_token, verify_refresh_token
from jose import jwt
from app.core.config import settings

class TokenService:
    """Service for managing JWT tokens"""
    
    @staticmethod
    def blacklist_token(db: Session, token: str) -> bool:
        """Add a token to the blacklist"""
        try:
            # Decode token to get expiration
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            exp_timestamp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp_timestamp)
            
            # Check if token is already blacklisted
            existing = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
            if existing:
                return True
            
            # Add to blacklist
            blacklisted_token = BlacklistedToken(
                token=token,
                expires_at=expires_at
            )
            db.add(blacklisted_token)
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    @staticmethod
    def is_token_blacklisted(db: Session, token: str) -> bool:
        """Check if a token is blacklisted"""
        blacklisted = db.query(BlacklistedToken).filter(
            BlacklistedToken.token == token,
            BlacklistedToken.is_blacklisted == True
        ).first()
        return blacklisted is not None
    
    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """Remove expired tokens from blacklist"""
        try:
            now = datetime.utcnow()
            expired_tokens = db.query(BlacklistedToken).filter(
                BlacklistedToken.expires_at < now
            ).all()
            
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
