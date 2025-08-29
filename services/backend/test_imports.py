#!/usr/bin/env python3
"""
Test script to check if all imports work correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test all critical imports"""
    print("🧪 Testing Safe Wave imports...")
    print("=" * 40)
    
    # Test 1: Core configuration
    try:
        from app.core.config import settings
        print("✅ Core config imported")
    except Exception as e:
        print(f"❌ Core config failed: {e}")
        return False
    
    # Test 2: Database
    try:
        from app.core.database import engine, Base
        print("✅ Database imported")
    except Exception as e:
        print(f"❌ Database failed: {e}")
        return False
    
    # Test 3: Models
    try:
        from app.models.user import User
        print("✅ User model imported")
    except Exception as e:
        print(f"❌ User model failed: {e}")
        return False
    
    try:
        from app.models.audio_analysis import AudioAnalysis
        print("✅ Audio analysis model imported")
    except Exception as e:
        print(f"❌ Audio analysis model failed: {e}")
        return False
    
    # Test 4: Controllers
    try:
        from app.controllers.audio_controller import AudioController
        print("✅ Audio controller imported")
    except Exception as e:
        print(f"❌ Audio controller failed: {e}")
        return False
    
    # Test 5: Views
    try:
        from app.views.auth import router as auth_router
        print("✅ Auth views imported")
    except Exception as e:
        print(f"❌ Auth views failed: {e}")
        return False
    
    print("\n" + "=" * 40)
    print("✅ All imports successful!")
    return True

if __name__ == "__main__":
    success = test_imports()
    if not success:
        print("\n❌ Some imports failed. Check the errors above.")
        sys.exit(1)
