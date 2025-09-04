#!/usr/bin/env python3
"""
Test script to verify the database restructuring is working correctly.

This script tests:
1. Database connection and table existence
2. EmailAlert model functionality
3. EmailAlert service functionality
4. Proper relationships between tables
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine, get_db
from app.models.user import User
from app.models.audio import Audio
from app.models.email_alert import EmailAlert
from app.services.email_alert_service import email_alert_service


def test_database_connection():
    """Test database connection and basic functionality."""
    print("🔍 Testing database connection...")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Database connected successfully: {version}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def test_table_existence():
    """Test that all required tables exist."""
    print("\n🔍 Testing table existence...")
    
    required_tables = [
        'users',
        'audios', 
        'email_alerts',
        'documents',
        'blacklisted_tokens',
        'alembic_version'
    ]
    
    try:
        with engine.connect() as conn:
            for table in required_tables:
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '{table}'
                    )
                """))
                exists = result.fetchone()[0]
                
                if exists:
                    print(f"✅ Table '{table}' exists")
                else:
                    print(f"❌ Table '{table}' missing")
                    return False
            
            return True
    except Exception as e:
        print(f"❌ Table existence check failed: {e}")
        return False


def test_email_alert_model():
    """Test EmailAlert model functionality."""
    print("\n🔍 Testing EmailAlert model...")
    
    try:
        # Test model creation
        alert = EmailAlert(
            user_id=1,
            audio_id=1,
            alert_type="test_alert",
            recipient_email="test@example.com",
            recipient_type="care_person",
            subject="Test Alert",
            body="This is a test alert",
            risk_level="low",
            urgency_level="low",
            sent_successfully=True,
            retry_count=0,
            max_retries=3
        )
        
        # Test to_dict method
        alert_dict = alert.to_dict()
        
        if isinstance(alert_dict, dict) and 'alert_type' in alert_dict:
            print("✅ EmailAlert model working correctly")
            return True
        else:
            print("❌ EmailAlert model to_dict() failed")
            return False
            
    except Exception as e:
        print(f"❌ EmailAlert model test failed: {e}")
        return False


def test_migration_status():
    """Test migration status and version."""
    print("\n🔍 Testing migration status...")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.fetchone()
            
            if version and version[0] == '002':
                print(f"✅ Migration status correct: {version[0]}")
                return True
            else:
                print(f"❌ Migration status incorrect: {version[0] if version else 'None'}")
                return False
                
    except Exception as e:
        print(f"❌ Migration status check failed: {e}")
        return False


def test_relationships():
    """Test database relationships."""
    print("\n🔍 Testing database relationships...")
    
    try:
        with engine.connect() as conn:
            # Test foreign key constraints exist
            fk_queries = [
                "SELECT 1 FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'email_alerts' AND constraint_name LIKE '%user_id%'",
                "SELECT 1 FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'email_alerts' AND constraint_name LIKE '%audio_id%'",
                "SELECT 1 FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'audios' AND constraint_name LIKE '%user_id%'"
            ]
            
            for i, query in enumerate(fk_queries, 1):
                result = conn.execute(text(query))
                if result.fetchone():
                    print(f"✅ Foreign key constraint {i} exists")
                else:
                    print(f"❌ Foreign key constraint {i} missing")
                    return False
            
            return True
            
    except Exception as e:
        print(f"❌ Relationship test failed: {e}")
        return False


def test_email_alert_service():
    """Test EmailAlert service functionality."""
    print("\n🔍 Testing EmailAlert service...")
    
    try:
        # Test service initialization
        service = email_alert_service
        
        if hasattr(service, 'send_immediate_voice_alert') and \
           hasattr(service, 'send_onboarding_analysis_alert') and \
           hasattr(service, 'send_critical_alert'):
            print("✅ EmailAlert service methods available")
            return True
        else:
            print("❌ EmailAlert service methods missing")
            return False
    except Exception as e:
        print(f"❌ EmailAlert service test failed: {e}")
        return False


def run_all_tests():
    """Run all tests and provide summary."""
    print("🚀 Starting Database Restructuring Tests")
    print("=" * 50)
    tests = [
        ("Database Connection", test_database_connection),
        ("Table Existence", test_table_existence),
        ("EmailAlert Model", test_email_alert_model),
        ("Migration Status", test_migration_status),
        ("Database Relationships", test_relationships),
        ("EmailAlert Service", test_email_alert_service),
    ]
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    passed = 0
    total = len(results)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    if passed == total:
        print("🎉 ALL TESTS PASSED! Database restructuring is successful!")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
