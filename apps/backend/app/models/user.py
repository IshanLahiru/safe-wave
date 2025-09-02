from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    # BaseModel already provides id, created_at, updated_at
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)  # Renamed for consistency
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
    
    # Timestamps are provided by BaseModel
    
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
