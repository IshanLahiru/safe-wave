from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta
from app.core.database import get_db
from app.controllers.user_controller import UserController
from app.schemas.user import UserLogin, UserSignup, Token, UserResponse, RefreshToken
from app.utils.auth import create_token_pair, verify_token, verify_refresh_token
from app.core.config import settings
from app.services.token_service import TokenService
from app.models.user import User

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """User login endpoint"""
    user = UserController.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create both access and refresh tokens
    access_token, refresh_token, expires_in = create_token_pair(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in
    }

@router.post("/signup", response_model=Token)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """User registration endpoint"""
    # Check if user already exists
    existing_user = UserController.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = UserController.create_user(db, user_data, user_data.password)
    
    # Create tokens for automatic login
    access_token, refresh_token, expires_in = create_token_pair(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_data: RefreshToken, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        # Verify the refresh token
        token_data = verify_refresh_token(refresh_data.refresh_token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Test database connection before querying user
        try:
            db.execute(text("SELECT 1"))
        except Exception as db_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Database connection failed during token refresh: {db_error}")
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user still exists
        user = UserController.get_user_by_email(db, email=token_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create new token pair
        access_token, refresh_token, expires_in = create_token_pair(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors and return service unavailable
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error during token refresh: {e}")
        
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """User logout endpoint"""
    token = credentials.credentials
    
    # Blacklist the token
    if TokenService.blacklist_token(db, token):
        return {"message": "Successfully logged out"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout"
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    token = credentials.credentials
    
    try:
        # Check if token is blacklisted
        if TokenService.is_token_blacklisted(db, token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token_data = verify_token(token)
        if token_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = UserController.get_user_by_email(db, email=token_data.email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors and return authentication error
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error during user authentication: {e}")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/complete-onboarding")
async def complete_onboarding(
    onboarding_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding with all answers and uploaded files"""
    try:
        # Update user with onboarding data
        current_user.onboarding_answers = onboarding_data
        current_user.is_onboarding_complete = True
        
        # Update emergency contact information if provided
        if 'emergency_contact_name' in onboarding_data:
            current_user.emergency_contact_name = onboarding_data['emergency_contact_name']
        if 'emergency_contact_email' in onboarding_data:
            current_user.emergency_contact_email = onboarding_data['emergency_contact_email']
        if 'emergency_contact_relationship' in onboarding_data:
            current_user.emergency_contact_relationship = onboarding_data['emergency_contact_relationship']
        
        # Update preferences if provided
        if 'checkin_frequency' in onboarding_data:
            if not current_user.preferences:
                current_user.preferences = {}
            current_user.preferences['checkinFrequency'] = onboarding_data['checkin_frequency']
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "message": "Onboarding completed successfully",
            "user": current_user.to_dict()
        }
        
    except Exception as e:
        db.rollback()
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error completing onboarding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete onboarding"
        )
