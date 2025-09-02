#!/usr/bin/env python3
"""
Comprehensive Authentication Flow Test for Safe Wave Backend
Tests signup, login, token refresh, and protected endpoints
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://192.168.31.14:9000"
TEST_USER = {
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
}

class AuthFlowTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        
    def log(self, message: str, status: str = "INFO"):
        """Log test messages with status"""
        print(f"[{status}] {message}")
        
    def test_health_check(self) -> bool:
        """Test if the backend is healthy"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                self.log("✅ Backend health check passed")
                return True
            else:
                self.log(f"❌ Backend health check failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Backend connection failed: {e}", "ERROR")
            return False
    
    def test_signup(self, user_data: Dict[str, str]) -> bool:
        """Test user signup"""
        try:
            self.log(f"🔐 Testing signup for {user_data['email']}")
            response = self.session.post(
                f"{self.base_url}/auth/signup",
                json=user_data
            )
            
            if response.status_code == 201:
                data = response.json()
                self.log("✅ Signup successful")
                self.log(f"   User ID: {data.get('user', {}).get('id')}")
                self.log(f"   Email: {data.get('user', {}).get('email')}")
                return True
            elif response.status_code == 400:
                error_detail = response.json().get('detail', 'Unknown error')
                if "already registered" in error_detail.lower():
                    self.log("⚠️  User already exists, continuing with login test")
                    return True
                else:
                    self.log(f"❌ Signup failed: {error_detail}", "ERROR")
                    return False
            else:
                self.log(f"❌ Signup failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Signup error: {e}", "ERROR")
            return False
    
    def test_login(self, email: str, password: str) -> bool:
        """Test user login"""
        try:
            self.log(f"🔑 Testing login for {email}")
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                self.refresh_token = data.get('refresh_token')
                
                self.log("✅ Login successful")
                self.log(f"   Token type: {data.get('token_type')}")
                self.log(f"   Expires in: {data.get('expires_in')} seconds")
                self.log(f"   Access token: {self.access_token[:20]}...")
                self.log(f"   Refresh token: {self.refresh_token[:20]}...")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Login error: {e}", "ERROR")
            return False
    
    def test_protected_endpoint(self) -> bool:
        """Test accessing a protected endpoint with access token"""
        try:
            self.log("🔒 Testing protected endpoint access")
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log("✅ Protected endpoint access successful")
                self.log(f"   User ID: {data.get('id')}")
                self.log(f"   Email: {data.get('email')}")
                self.log(f"   Name: {data.get('name')}")
                return True
            else:
                self.log(f"❌ Protected endpoint failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Protected endpoint error: {e}", "ERROR")
            return False
    
    def test_token_refresh(self) -> bool:
        """Test token refresh functionality"""
        try:
            self.log("🔄 Testing token refresh")
            response = self.session.post(
                f"{self.base_url}/auth/refresh",
                json={"refresh_token": self.refresh_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                old_access_token = self.access_token
                self.access_token = data.get('access_token')
                
                self.log("✅ Token refresh successful")
                self.log(f"   New access token: {self.access_token[:20]}...")
                self.log(f"   Token changed: {old_access_token != self.access_token}")
                return True
            else:
                self.log(f"❌ Token refresh failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Token refresh error: {e}", "ERROR")
            return False
    
    def test_invalid_token(self) -> bool:
        """Test behavior with invalid token"""
        try:
            self.log("🚫 Testing invalid token handling")
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = self.session.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 401:
                self.log("✅ Invalid token correctly rejected")
                return True
            else:
                self.log(f"❌ Invalid token not handled properly: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Invalid token test error: {e}", "ERROR")
            return False
    
    def test_logout(self) -> bool:
        """Test user logout"""
        try:
            self.log("👋 Testing logout")
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.post(f"{self.base_url}/auth/logout", headers=headers)
            
            if response.status_code == 200:
                self.log("✅ Logout successful")
                return True
            else:
                self.log(f"❌ Logout failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Logout error: {e}", "ERROR")
            return False
    
    def run_full_test_suite(self) -> bool:
        """Run the complete authentication flow test"""
        self.log("🚀 Starting Authentication Flow Test Suite")
        self.log("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("User Signup", lambda: self.test_signup(TEST_USER)),
            ("User Login", lambda: self.test_login(TEST_USER["email"], TEST_USER["password"])),
            ("Protected Endpoint", self.test_protected_endpoint),
            ("Token Refresh", self.test_token_refresh),
            ("Protected Endpoint (After Refresh)", self.test_protected_endpoint),
            ("Invalid Token", self.test_invalid_token),
            ("User Logout", self.test_logout),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n📋 Running: {test_name}")
            self.log("-" * 40)
            
            if test_func():
                passed += 1
            else:
                self.log(f"❌ {test_name} FAILED", "ERROR")
        
        self.log("\n" + "=" * 60)
        self.log(f"🏁 Test Suite Complete: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! Authentication flow is working correctly.", "SUCCESS")
            return True
        else:
            self.log(f"⚠️  {total - passed} tests failed. Please check the issues above.", "WARNING")
            return False

def main():
    """Main function to run the authentication tests"""
    tester = AuthFlowTester(BASE_URL)
    success = tester.run_full_test_suite()
    
    if success:
        print("\n✅ Backend authentication system is working correctly!")
        return 0
    else:
        print("\n❌ Backend authentication system has issues that need to be fixed!")
        return 1

if __name__ == "__main__":
    exit(main())
