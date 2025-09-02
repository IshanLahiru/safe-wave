#!/usr/bin/env python3
"""
Test script for onboarding analysis functionality
Run this script to test the onboarding analysis service without the full web server
"""

import sys
import os
import json
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_onboarding_analysis():
    """Test the onboarding analysis service with sample data"""
    
    print("🧪 Testing Onboarding Analysis Service")
    print("=" * 50)
    
    try:
        # Import the service
        from app.services.onboarding_analysis_service import onboarding_analysis_service
        
        # Sample onboarding answers (similar to what users provide)
        sample_onboarding_answers = {
            'safety_concerns': 'Some concerns',
            'support_system': 'Limited',
            'crisis_plan': 'No, I need help creating one',
            'daily_struggles': 'I struggle with anxiety and low mood most days. It\'s hard to get out of bed and I feel overwhelmed by simple tasks.',
            'coping_mechanisms': 'I try to take deep breaths and sometimes talk to friends, but it doesn\'t always help.',
            'stress_level': 8,
            'sleep_quality': 3,
            'app_goals': 'I want to track my mental health and get better at managing my anxiety and depression.',
            'checkin_frequency': 'Daily',
            'emergency_contact_name': 'John Doe',
            'emergency_contact_email': 'john.doe@example.com',
            'emergency_contact_relationship': 'Family member'
        }
        
        print("\n1. Testing onboarding analysis...")
        analysis_result = onboarding_analysis_service.analyze_onboarding_questions(
            sample_onboarding_answers, "Test User"
        )
        
        print("✅ Analysis completed successfully!")
        print(f"Risk Level: {analysis_result.get('risk_level', 'Unknown')}")
        print(f"Urgency Level: {analysis_result.get('urgency_level', 'Unknown')}")
        print(f"Summary: {analysis_result.get('summary', 'No summary')}")
        
        # Test 2: Test email service
        print("\n2. Testing email service...")
        from app.utils.email_service import EmailService
        
        email_service = EmailService()
        
        # Note: This will only work if SMTP is properly configured
        print("📧 Attempting to send test email...")
        
        # For testing, we'll use a dummy email (replace with real email for actual testing)
        test_email = "test@example.com"  # Replace with your email for testing
        
        email_sent = email_service.send_onboarding_analysis_alert(
            to_email=test_email,
            user_name="Test User",
            onboarding_analysis=analysis_result,
            audio_analysis_failed=True
        )
        
        if email_sent:
            print(f"✅ Email sent successfully to {test_email}")
        else:
            print(f"❌ Failed to send email to {test_email}")
            print("   (This is expected if SMTP is not configured)")
        
        # Test 3: Display full analysis results
        print("\n3. Full Analysis Results:")
        print("-" * 30)
        print(json.dumps(analysis_result, indent=2))
        
        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

def test_email_configuration():
    """Test if email configuration is properly set up"""
    print("\n📧 Testing Email Configuration")
    print("=" * 40)
    
    try:
        from app.core.config import settings
        
        print(f"SMTP Server: {settings.SMTP_SERVER}")
        print(f"SMTP Port: {settings.SMTP_PORT}")
        print(f"SMTP Username: {settings.SMTP_USERNAME}")
        print(f"SMTP Password: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 'Not set'}")
        print(f"From Email: {settings.FROM_EMAIL}")
        
        # Check if required fields are set
        required_fields = ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'FROM_EMAIL']
        missing_fields = [field for field in required_fields if not getattr(settings, field, None)]
        
        if missing_fields:
            print(f"\n⚠️  Missing email configuration: {', '.join(missing_fields)}")
            print("   Email functionality will not work until these are configured.")
        else:
            print("\n✅ Email configuration appears complete!")
            
    except Exception as e:
        print(f"❌ Failed to check email configuration: {e}")

if __name__ == "__main__":
    print("🚀 Safe Wave - Onboarding Analysis Test")
    print("=" * 50)
    
    # Test email configuration first
    test_email_configuration()
    
    # Test the onboarding analysis service
    test_onboarding_analysis()
    
    print("\n" + "=" * 50)
    print("🏁 Test script completed!") 
