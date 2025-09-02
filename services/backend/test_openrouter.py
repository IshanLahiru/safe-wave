#!/usr/bin/env python3
"""
Test script for OpenRouter integration
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

def test_openrouter_service():
    """Test the OpenRouter service"""
    try:
        from app.services.openrouter_service import openrouter_service
        
        print("=" * 80)
        print("🧪 TESTING OPENROUTER SERVICE")
        print("=" * 80)
        
        # Check service info
        service_info = openrouter_service.get_service_info()
        print(f"📊 Service Info: {service_info}")
        
        if not openrouter_service.is_available():
            print("❌ OpenRouter service not available - API key not configured")
            print("💡 Set OPENROUTER_API_KEY in your environment or .env file")
            return False
        
        # Test with sample data
        sample_transcription = "I'm feeling really down today. I don't know if I can keep going like this."
        sample_user_data = {
            "name": "Test User",
            "carePersonEmail": "test@example.com",
            "emergencyContact": {"email": "emergency@example.com"}
        }
        
        print(f"📝 Testing with transcription: {sample_transcription}")
        print(f"👤 User data: {sample_user_data}")
        
        # Test analysis
        result = openrouter_service.analyze_mental_health(sample_transcription, sample_user_data)
        
        print("=" * 80)
        print("✅ OPENROUTER TEST SUCCESSFUL")
        print("=" * 80)
        print(f"📊 Risk level: {result.get('risk_level', 'unknown')}")
        print(f"⚠️ Urgency level: {result.get('urgency_level', 'unknown')}")
        print(f"📝 Summary: {result.get('summary', '')[:100]}...")
        print(f"🔍 Key concerns: {result.get('key_concerns', [])}")
        print(f"💡 Recommendations: {result.get('recommendations', [])}")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting OpenRouter Integration Tests")
    print("=" * 80)
    
    # Test OpenRouter service
    test_success = test_openrouter_service()
    
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"✅ OpenRouter Service: {'PASS' if test_success else 'FAIL'}")
    
    if test_success:
        print("🎉 Test passed! OpenRouter integration is working.")
    else:
        print("❌ Test failed. Check the logs above for details.")
    
    print("=" * 80)
