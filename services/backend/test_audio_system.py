#!/usr/bin/env python3
"""
Test script for the audio analysis system
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.models.audio_analysis import AudioAnalysis
from app.controllers.audio_controller import AudioController
from app.utils.email_service import EmailService

def test_audio_system():
    """Test the audio analysis system components"""
    print("Testing Safe Wave Audio Analysis System...")
    print("=" * 50)
    
    # Test 1: Configuration
    print("1. Testing Configuration...")
    print(f"   OpenAI API Key: {'✓ Set' if settings.OPENAI_API_KEY else '✗ Not set'}")
    print(f"   SMTP Server: {settings.SMTP_SERVER}")
    print(f"   Upload Directory: {settings.UPLOAD_DIR}")
    print(f"   Max File Size: {settings.MAX_FILE_SIZE // (1024*1024)}MB")
    
    # Test 2: Audio Controller
    print("\n2. Testing Audio Controller...")
    try:
        controller = AudioController()
        print(f"   OpenAI Client: {'✓ Initialized' if controller.openai_client else '✗ Failed'}")
        print(f"   Email Service: {'✓ Available' if controller.email_service else '✗ Failed'}")
    except Exception as e:
        print(f"   ✗ Controller Error: {e}")
    
    # Test 3: Email Service
    print("\n3. Testing Email Service...")
    try:
        email_service = EmailService()
        print(f"   SMTP Server: {email_service.smtp_server}")
        print(f"   SMTP Port: {email_service.smtp_port}")
        print(f"   From Email: {email_service.from_email}")
    except Exception as e:
        print(f"   ✗ Email Service Error: {e}")
    
    # Test 4: Database Models
    print("\n4. Testing Database Models...")
    try:
        # This would test the model creation
        print("   ✓ Models imported successfully")
    except Exception as e:
        print(f"   ✗ Model Error: {e}")
    
    print("\n" + "=" * 50)
    print("Audio Analysis System Test Complete!")
    
    # Recommendations
    print("\n📋 Setup Recommendations:")
    if not settings.OPENAI_API_KEY:
        print("   • Set OPENAI_API_KEY in your .env file")
    if not settings.SMTP_USERNAME:
        print("   • Configure SMTP settings for email alerts")
    print("   • Create uploads/audio directory")
    print("   • Run database migrations: alembic upgrade head")

if __name__ == "__main__":
    test_audio_system()
