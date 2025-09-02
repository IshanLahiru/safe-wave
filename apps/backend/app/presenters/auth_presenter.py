"""
Authentication Presenter - handles authentication-related presentation logic.
This follows the MVP pattern where the presenter coordinates between views and business logic.
"""

import logging
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.services.user.user_service import user_service
from app.utils.auth import create_access_token, create_refresh_token
from app.exceptions.base import UserDataError
from app.core.config import settings

logger = logging.getLogger(__name__)


class AuthPresenter:
    """
    Presenter for authentication-related operations.
    Handles the coordination between auth views and user business logic.
    """
    
    def register_user(
        self, 
        db: Session, 
        email: str, 
        password: str, 
        name: str
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Register a new user.
        
        Returns:
            Tuple of (success: bool, message: str, user_data: Optional[Dict])
        """
        try:
            logger.info(f"🔐 Registering new user: {email}")
            
            # Create user using the service
            user = user_service.create_user(db, email, password, name)
            
            # Generate tokens
            access_token = create_access_token(data={"sub": str(user.id)})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})
            
            # Prepare user data for response
            user_data = {
                "user": user_service.get_user_profile(db, user.id),
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
            
            logger.info(f"✅ User registered successfully: {user.name}")
            return True, f"Welcome to Safe Wave, {user.name}!", user_data
            
        except UserDataError as e:
            logger.warning(f"⚠️ Registration failed: {e.message}")
            return False, e.message, None
            
        except Exception as e:
            logger.error(f"❌ Unexpected registration error: {e}", exc_info=True)
            return False, "Something went wrong during registration. Please try again.", None
    
    def login_user(
        self, 
        db: Session, 
        email: str, 
        password: str
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Authenticate and login a user.
        
        Returns:
            Tuple of (success: bool, message: str, user_data: Optional[Dict])
        """
        try:
            logger.info(f"🔐 Login attempt for: {email}")
            
            # Authenticate user
            user = user_service.authenticate_user(db, email, password)
            if not user:
                logger.warning(f"⚠️ Login failed for {email}: Invalid credentials")
                return False, "Invalid email or password. Please check your credentials and try again.", None
            
            # Generate tokens
            access_token = create_access_token(data={"sub": str(user.id)})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})
            
            # Prepare user data for response
            user_data = {
                "user": user_service.get_user_profile(db, user.id),
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
            
            logger.info(f"✅ User logged in successfully: {user.name}")
            return True, f"Welcome back, {user.name}!", user_data
            
        except Exception as e:
            logger.error(f"❌ Unexpected login error: {e}", exc_info=True)
            return False, "Something went wrong during login. Please try again.", None
    
    def refresh_token(
        self, 
        db: Session, 
        user_id: int
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Refresh user's access token.
        
        Returns:
            Tuple of (success: bool, message: str, token_data: Optional[Dict])
        """
        try:
            logger.info(f"🔄 Refreshing token for user: {user_id}")
            
            # Verify user exists
            user = user_service.get_user_by_id(db, user_id)
            if not user:
                logger.warning(f"⚠️ Token refresh failed: User {user_id} not found")
                return False, "User not found. Please login again.", None
            
            # Generate new access token
            access_token = create_access_token(data={"sub": str(user.id)})
            
            token_data = {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
            logger.info(f"✅ Token refreshed successfully for user: {user.name}")
            return True, "Token refreshed successfully", token_data
            
        except Exception as e:
            logger.error(f"❌ Token refresh error: {e}", exc_info=True)
            return False, "Failed to refresh token. Please login again.", None
    
    def get_current_user_profile(
        self, 
        db: Session, 
        user_id: int
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Get current user's profile information.
        
        Returns:
            Tuple of (success: bool, message: str, profile_data: Optional[Dict])
        """
        try:
            logger.info(f"👤 Getting profile for user: {user_id}")
            
            profile = user_service.get_user_profile(db, user_id)
            
            logger.info(f"✅ Profile retrieved successfully")
            return True, "Profile retrieved successfully", profile
            
        except UserDataError as e:
            logger.warning(f"⚠️ Profile retrieval failed: {e.message}")
            return False, e.message, None
            
        except Exception as e:
            logger.error(f"❌ Profile retrieval error: {e}", exc_info=True)
            return False, "Failed to retrieve profile. Please try again.", None
    
    def update_onboarding(
        self, 
        db: Session, 
        user_id: int, 
        onboarding_data: Dict[str, Any]
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Update user's onboarding information.
        
        Returns:
            Tuple of (success: bool, message: str, user_data: Optional[Dict])
        """
        try:
            logger.info(f"📝 Updating onboarding for user: {user_id}")
            
            # Update onboarding using the service
            user = user_service.update_onboarding_answers(db, user_id, onboarding_data)
            
            # Get updated profile
            profile = user_service.get_user_profile(db, user.id)
            
            logger.info(f"✅ Onboarding updated successfully for: {user.name}")
            return True, "Onboarding completed successfully! You're all set.", profile
            
        except UserDataError as e:
            logger.warning(f"⚠️ Onboarding update failed: {e.message}")
            return False, e.message, None
            
        except Exception as e:
            logger.error(f"❌ Onboarding update error: {e}", exc_info=True)
            return False, "Failed to update onboarding. Please try again.", None


# Global instance
auth_presenter = AuthPresenter()
