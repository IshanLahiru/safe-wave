"""
Base model class with common functionality.
Provides consistent timestamps and utility methods for all models.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List

Base = declarative_base()


class BaseModel(Base):
    """
    Base model class that provides common functionality for all models.
    Includes automatic timestamps and common query methods.
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance to dictionary"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def update_from_dict(self, data: Dict[str, Any]) -> None:
        """Update model instance from dictionary"""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @classmethod
    def create(cls, db: Session, **kwargs) -> 'BaseModel':
        """Create a new instance and save to database"""
        instance = cls(**kwargs)
        db.add(instance)
        db.commit()
        db.refresh(instance)
        return instance
    
    @classmethod
    def get_by_id(cls, db: Session, id: int) -> Optional['BaseModel']:
        """Get instance by ID"""
        return db.query(cls).filter(cls.id == id).first()
    
    @classmethod
    def get_all(cls, db: Session, skip: int = 0, limit: int = 100) -> List['BaseModel']:
        """Get all instances with pagination"""
        return db.query(cls).offset(skip).limit(limit).all()
    
    @classmethod
    def count(cls, db: Session) -> int:
        """Count total instances"""
        return db.query(cls).count()
    
    def save(self, db: Session) -> 'BaseModel':
        """Save instance to database"""
        db.add(self)
        db.commit()
        db.refresh(self)
        return self
    
    def delete(self, db: Session) -> None:
        """Delete instance from database"""
        db.delete(self)
        db.commit()
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id})>"
