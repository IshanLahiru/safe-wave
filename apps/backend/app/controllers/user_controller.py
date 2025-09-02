from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, OnboardingData
from app.utils.auth import get_password_hash, verify_password
from typing import Optional, Dict, Any

class UserController:
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate, password: str) -> User:
        """Create a new user"""
        hashed_password = get_password_hash(password)
        db_user = User(
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            role=user_data.role,
            preferences={
                "checkinFrequency": "Daily",
                "darkMode": False,
                "language": "en"
            }
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = UserController.get_user_by_email(db, email)
        if user:
            # Use bcrypt for password verification
            from app.utils.auth import verify_password
            if verify_password(password, user.hashed_password):
                return user
        return None
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update user information"""
        user = UserController.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def complete_onboarding(db: Session, user_id: int, onboarding_data: OnboardingData) -> Optional[User]:
        """Complete user onboarding"""
        user = UserController.get_user_by_id(db, user_id)
        if not user:
            return None
        
        # Update emergency contact information
        user.emergency_contact_name = onboarding_data.emergency_contact_name
        user.emergency_contact_email = onboarding_data.emergency_contact_email
        user.emergency_contact_relationship = onboarding_data.emergency_contact_relationship
        user.care_person_email = onboarding_data.care_person_email
        
        # Update preferences
        if user.preferences is None:
            user.preferences = {}
        user.preferences["checkinFrequency"] = onboarding_data.checkin_frequency or "Daily"
        
        # Store onboarding answers
        user.onboarding_answers = onboarding_data.model_dump() if hasattr(onboarding_data, 'model_dump') else onboarding_data.dict()
        
        # Mark onboarding as complete
        user.is_onboarding_complete = True
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user_preferences(db: Session, user_id: int, preferences: Dict[str, Any]) -> Optional[User]:
        """Update user preferences"""
        user = UserController.get_user_by_id(db, user_id)
        if not user:
            return None
        
        if user.preferences is None:
            user.preferences = {}
        user.preferences.update(preferences)
        
        db.commit()
        db.refresh(user)
        return user
