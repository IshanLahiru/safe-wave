#!/usr/bin/env python3
"""
Test script for immediate voice alert functionality
"""

import os
import sys
import logging

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_immediate_voice_alert():
    """Test the immediate voice alert functionality"""
    try:
        from app.core.database import get_db
        from app.controllers.audio_controller import audio_controller
        
        print("=" * 80)
        print("🧪 TESTING IMMEDIATE VOICE ALERT FUNCTIONALITY")
        print("=" * 80)
        
        # Get database session
        db = next(get_db())
        
        # Get user data
        from app.models.user import User
        user = db.query(User).filter(User.id == 2).first()
        
        if not user:
            print("❌ User not found")
            return False
        
        print(f"👤 User: {user.name}")
        print(f"📧 Care person email: {user.care_person_email}")
        print(f"🚨 Emergency contact email: {user.emergency_contact_email}")
        
        # Test data
        test_transcription = "I'm feeling really down today. I don't know if I can keep going like this."
        test_user_data = {
            "name": user.name,
            "carePersonEmail": user.care_person_email,
            "emergencyContact": {"email": user.emergency_contact_email}
        }
        
        print(f"📝 Test transcription: {test_transcription}")
        print(f"🎯 Confidence: 0.85")
        
        # Test the immediate voice alert
        print("\n🔄 Testing immediate voice alert...")
        success = audio_controller.send_immediate_voice_alert(
            db=db,
            audio_id=999,  # Dummy ID for testing
            user_id=user.id,
            user_data=test_user_data,
            transcription=test_transcription,
            confidence=0.85
        )
        
        if success:
            print("✅ Immediate voice alert test completed successfully!")
            print("📧 Emails should have been sent to care person and emergency contact")
        else:
            print("❌ Immediate voice alert test failed")
            print("🔍 Check the logs above for details")
        
        return success
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Immediate Voice Alert Test")
    print("=" * 80)
    
    # Test immediate voice alert
    test_success = test_immediate_voice_alert()
    
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"✅ Immediate Voice Alert: {'PASS' if test_success else 'FAIL'}")
    
    if test_success:
        print("🎉 Test passed! Immediate voice alerts are working.")
        print("📧 Check your email inboxes for the test emails.")
    else:
        print("❌ Test failed. Check the logs above for details.")
    
    print("=" * 80)
