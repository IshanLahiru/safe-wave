#!/usr/bin/env python3
"""
Test script to verify API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("Testing Safe Wave API endpoints...")
    print("=" * 40)
    
    # Test root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Root endpoint error: {e}")
    
    # Test health endpoint
    try:
        response = requests.get(f"{BASE_URL}/health/")
        print(f"Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Health endpoint error: {e}")
    
    # Test signup endpoint
    try:
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "testpassword"
        }
        response = requests.post(f"{BASE_URL}/auth/signup", json=user_data)
        print(f"Signup endpoint: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Signup endpoint error: {e}")

if __name__ == "__main__":
    test_endpoints()
