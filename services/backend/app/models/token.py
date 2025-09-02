from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class BlacklistedToken(Base):
    """Model for blacklisted JWT tokens"""

    __tablename__ = "blacklisted_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    blacklisted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_blacklisted = Column(Boolean, default=True)

    def __repr__(self):
        return f"<BlacklistedToken(id={self.id}, token={self.token[:20]}..., expires_at={self.expires_at})>"
