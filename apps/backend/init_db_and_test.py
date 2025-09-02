#!/usr/bin/env python3
"""
Initialize database and run authentication tests
"""

import os
import sys
import time
import requests
from sqlalchemy import text

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def init_database():
    """Initialize the database with all tables"""
    try:
        print("🗄️ Initializing database...")
        
        # Import after adding to path
        from app.core.database import engine, SessionLocal
        from app.models.base import Base
        
        # Import all models to ensure they're registered
        from app.models.user import User
        from app.models.audio import Audio
        from app.models.document import Document
        from app.models.audio_analysis import AudioAnalysis
        from app.models.token import BlacklistedToken
        from app.models.content import ContentCategory, Video, MealPlan, Quote, Article, UserFavorite, UserProgress
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Test database connection
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            print("✅ Database initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Database test failed: {e}")
            return False
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    base_url = "http://192.168.31.14:9000"
    test_user = {
        "email": "test@example.com",
        "password": "test123",
        "name": "Test User"
    }
    
    print("\n🔐 Testing authentication endpoints...")
    
    try:
        # Test health endpoint
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/health/")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
        
        # Test signup
        print("2. Testing user signup...")
        response = requests.post(f"{base_url}/auth/signup", json=test_user)
        if response.status_code in [201, 400]:  # 400 if user already exists
            if response.status_code == 201:
                print("   ✅ Signup successful")
            else:
                error_detail = response.json().get('detail', '')
                if "already registered" in error_detail.lower():
                    print("   ⚠️  User already exists, continuing...")
                else:
                    print(f"   ❌ Signup failed: {error_detail}")
                    return False
        else:
            print(f"   ❌ Signup failed: {response.status_code} - {response.text}")
            return False
        
        # Test login
        print("3. Testing user login...")
        login_data = {"email": test_user["email"], "password": test_user["password"]}
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            refresh_token = data.get('refresh_token')
            print("   ✅ Login successful")
            print(f"   📝 Access token: {access_token[:20]}...")
            print(f"   📝 Refresh token: {refresh_token[:20]}...")
        else:
            print(f"   ❌ Login failed: {response.status_code} - {response.text}")
            return False
        
        # Test protected endpoint
        print("4. Testing protected endpoint...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{base_url}/users/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print("   ✅ Protected endpoint access successful")
            print(f"   👤 User: {user_data.get('name')} ({user_data.get('email')})")
        else:
            print(f"   ❌ Protected endpoint failed: {response.status_code} - {response.text}")
            return False
        
        # Test token refresh
        print("5. Testing token refresh...")
        refresh_data = {"refresh_token": refresh_token}
        response = requests.post(f"{base_url}/auth/refresh", json=refresh_data)
        if response.status_code == 200:
            new_data = response.json()
            new_access_token = new_data.get('access_token')
            print("   ✅ Token refresh successful")
            print(f"   📝 New access token: {new_access_token[:20]}...")
        else:
            print(f"   ❌ Token refresh failed: {response.status_code} - {response.text}")
            return False
        
        # Test logout
        print("6. Testing logout...")
        headers = {"Authorization": f"Bearer {new_access_token}"}
        response = requests.post(f"{base_url}/auth/logout", headers=headers)
        if response.status_code == 200:
            print("   ✅ Logout successful")
        else:
            print(f"   ❌ Logout failed: {response.status_code} - {response.text}")
            return False
        
        print("\n🎉 All authentication tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Authentication test error: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Safe Wave Backend - Database Initialization & Auth Test")
    print("=" * 60)
    
    # Initialize database
    if not init_database():
        print("\n❌ Database initialization failed. Exiting.")
        return 1
    
    # Wait a moment for the server to be ready
    print("\n⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Test authentication
    if not test_auth_endpoints():
        print("\n❌ Authentication tests failed.")
        return 1
    
    print("\n✅ All tests completed successfully!")
    print("🎯 Backend is working correctly with authentication flow.")
    return 0

if __name__ == "__main__":
    exit(main())
