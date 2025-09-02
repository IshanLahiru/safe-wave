from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "user"

# Create User Schema
class UserCreate(UserBase):
    pass

# Update User Schema
class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_onboarding_complete: Optional[bool] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_email: Optional[EmailStr] = None
    emergency_contact_relationship: Optional[str] = None
    care_person_email: Optional[EmailStr] = None
    preferences: Optional[Dict[str, Any]] = None
    onboarding_answers: Optional[Dict[str, Any]] = None

# User Response Schema
class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    isOnboardingComplete: bool
    emergencyContact: Optional[Dict[str, str]] = None
    carePersonEmail: Optional[str] = None
    preferences: Dict[str, Any]
    onboardingAnswers: Dict[str, Any]
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

# Login Schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Signup Schema
class UserSignup(UserBase):
    password: str

# Token Schema
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

# Refresh Token Schema
class RefreshToken(BaseModel):
    refresh_token: str

# Token Data Schema
class TokenData(BaseModel):
    email: Optional[str] = None

# Onboarding Schema
class OnboardingData(BaseModel):
    emergency_contact_name: str
    emergency_contact_email: EmailStr
    emergency_contact_relationship: str
    care_person_email: Optional[EmailStr] = None
    checkin_frequency: Optional[str] = "Daily"
    # Add other onboarding fields as needed
    daily_struggles: Optional[str] = None
    coping_mechanisms: Optional[str] = None
    stress_level: Optional[int] = None
    sleep_quality: Optional[int] = None
    app_goals: Optional[str] = None
