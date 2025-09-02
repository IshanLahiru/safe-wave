from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # user, healthcare_provider
    is_onboarding_complete = Column(Boolean, default=False)
    
    # Emergency contact information
    emergency_contact_name = Column(String)
    emergency_contact_email = Column(String)
    emergency_contact_relationship = Column(String)
    
    # Care person email
    care_person_email = Column(String)
    
    # Preferences (stored as JSON)
    preferences = Column(JSON, default={
        "checkinFrequency": "Daily",
        "darkMode": False,
        "language": "en"
    })
    
    # Onboarding answers (stored as JSON)
    onboarding_answers = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    audios = relationship("Audio", back_populates="user")
    documents = relationship("Document", back_populates="user")
    favorites = relationship("UserFavorite", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")
    
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "isOnboardingComplete": self.is_onboarding_complete,
            "emergencyContact": {
                "name": self.emergency_contact_name,
                "email": self.emergency_contact_email,
                "relationship": self.emergency_contact_relationship
            } if self.emergency_contact_name else None,
            "carePersonEmail": self.care_person_email,
            "preferences": self.preferences,
            "onboardingAnswers": self.onboarding_answers,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
