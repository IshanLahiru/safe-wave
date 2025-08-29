#!/usr/bin/env python3
"""
Simple test script to verify the API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("Health check: Connection failed (server not running)")
        return False

def test_root():
    """Test root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("Root endpoint: Connection failed (server not running)")
        return False

def test_signup():
    """Test user signup"""
    user_data = {
        "email": "test@example.com",
        "name": "Test User",
        "role": "user",
        "password": "testpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=user_data)
        print(f"Signup: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
        return response.status_code in [200, 201]
    except requests.exceptions.ConnectionError:
        print("Signup: Connection failed (server not running)")
        return False

if __name__ == "__main__":
    print("Testing Safe Wave API endpoints...")
    print("=" * 40)
    
    health_ok = test_health()
    root_ok = test_root()
    signup_ok = test_signup()
    
    print("=" * 40)
    if all([health_ok, root_ok, signup_ok]):
        print("All tests passed! ✅")
    else:
        print("Some tests failed! ❌")
