"""
User Service - handles all user-related business logic.
This service encapsulates user management, onboarding, and profile operations.
"""

import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.models.user import User
from app.exceptions.base import UserDataError
from app.utils.password_utils import get_password_hash, verify_password

logger = logging.getLogger(__name__)


class UserService:
    """
    Service class for handling user-related operations.
    Encapsulates business logic for user management and onboarding.
    """
    
    def create_user(
        self, 
        db: Session, 
        email: str, 
        password: str, 
        name: str
    ) -> User:
        """
        Create a new user with proper validation.
        
        Args:
            db: Database session
            email: User email address
            password: Plain text password (will be hashed)
            name: User's full name
            
        Returns:
            Created user instance
            
        Raises:
            UserDataError: If user already exists or validation fails
        """
        try:
            # Check if user already exists
            existing_user = self.get_user_by_email(db, email)
            if existing_user:
                raise UserDataError(
                    f"User with email {email} already exists",
                    missing_field="unique_email"
                )
            
            # Validate input
            if not email or not email.strip():
                raise UserDataError("Email is required", missing_field="email")
            
            if not password or len(password) < 6:
                raise UserDataError(
                    "Password must be at least 6 characters long", 
                    missing_field="password"
                )
            
            if not name or not name.strip():
                raise UserDataError("Name is required", missing_field="name")
            
            # Create user
            hashed_password = get_password_hash(password)
            user = User.create(
                db,
                email=email.strip().lower(),
                hashed_password=hashed_password,
                name=name.strip(),
                is_onboarding_complete=False
            )
            
            logger.info(f"✅ Created new user: {user.name} ({user.email})")
            return user
            
        except UserDataError:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to create user: {e}")
            raise UserDataError(f"Couldn't create user: {str(e)}")
    
    def authenticate_user(
        self, 
        db: Session, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User instance if authentication successful, None otherwise
        """
        try:
            user = self.get_user_by_email(db, email)
            if not user:
                logger.warning(f"Authentication failed: User {email} not found")
                return None
            
            if not verify_password(password, user.hashed_password):
                logger.warning(f"Authentication failed: Invalid password for {email}")
                return None
            
            logger.info(f"✅ User authenticated: {user.name} ({user.email})")
            return user
            
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return None
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email address"""
        return db.query(User).filter(User.email == email.lower().strip()).first()
    
    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return User.get_by_id(db, user_id)
    
    def update_onboarding_answers(
        self, 
        db: Session, 
        user_id: int, 
        answers: Dict[str, Any]
    ) -> User:
        """
        Update user's onboarding answers and mark onboarding as complete.
        
        Args:
            db: Database session
            user_id: User ID
            answers: Onboarding questionnaire answers
            
        Returns:
            Updated user instance
            
        Raises:
            UserDataError: If user not found or validation fails
        """
        try:
            user = self.get_user_by_id(db, user_id)
            if not user:
                raise UserDataError(f"User {user_id} not found", user_id=user_id)
            
            # Validate required answers
            required_fields = [
                'safetyConcerns', 'supportSystem', 'crisisPlan', 
                'dailyStruggles', 'copingMechanisms'
            ]
            
            missing_fields = [
                field for field in required_fields 
                if field not in answers or not answers[field]
            ]
            
            if missing_fields:
                raise UserDataError(
                    f"Missing required onboarding fields: {', '.join(missing_fields)}",
                    user_id=user_id,
                    missing_field=missing_fields[0]
                )
            
            # Update user
            user.onboarding_answers = answers
            user.is_onboarding_complete = True
            
            # Extract care person email if provided
            if 'emergencyContactEmail' in answers and answers['emergencyContactEmail']:
                user.emergency_contact_email = answers['emergencyContactEmail']
            
            user.save(db)
            
            logger.info(f"✅ Updated onboarding for user: {user.name}")
            return user
            
        except UserDataError:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to update onboarding: {e}")
            raise UserDataError(f"Couldn't update onboarding: {str(e)}", user_id=user_id)
    
    def update_care_person_email(
        self, 
        db: Session, 
        user_id: int, 
        care_person_email: str
    ) -> User:
        """
        Update user's care person email.
        
        Args:
            db: Database session
            user_id: User ID
            care_person_email: Care person's email address
            
        Returns:
            Updated user instance
        """
        try:
            user = self.get_user_by_id(db, user_id)
            if not user:
                raise UserDataError(f"User {user_id} not found", user_id=user_id)
            
            user.care_person_email = care_person_email.strip().lower() if care_person_email else None
            user.save(db)
            
            logger.info(f"✅ Updated care person email for user: {user.name}")
            return user
            
        except UserDataError:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to update care person email: {e}")
            raise UserDataError(f"Couldn't update care person email: {str(e)}", user_id=user_id)
    
    def get_user_profile(self, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Get user profile with safe data (no sensitive information).
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User profile dictionary
        """
        try:
            user = self.get_user_by_id(db, user_id)
            if not user:
                raise UserDataError(f"User {user_id} not found", user_id=user_id)
            
            profile = {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "isOnboardingComplete": user.is_onboarding_complete,
                "carePersonEmail": user.care_person_email,
                "emergencyContactEmail": user.emergency_contact_email,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
                "updatedAt": user.updated_at.isoformat() if user.updated_at else None
            }
            
            # Include onboarding answers if available (excluding sensitive data)
            if user.onboarding_answers:
                safe_answers = {
                    key: value for key, value in user.onboarding_answers.items()
                    if key not in ['emergencyContactEmail']  # Exclude sensitive fields
                }
                profile["onboardingAnswers"] = safe_answers
            
            return profile
            
        except UserDataError:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to get user profile: {e}")
            raise UserDataError(f"Couldn't get user profile: {str(e)}", user_id=user_id)


# Global instance
user_service = UserService()
