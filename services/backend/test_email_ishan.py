#!/usr/bin/env python3
"""
Custom Email Test Script for ishanlahiru2002@gmail.com
"""

import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_email_configuration():
    """Test if email configuration is properly set up"""
    print("📧 Testing Email Configuration")
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
            return False
        else:
            print("\n✅ Email configuration appears complete!")
            return True
            
    except Exception as e:
        print(f"❌ Failed to check email configuration: {e}")
        return False

def test_simple_email():
    """Test sending a simple email"""
    try:
        from app.utils.email_service import EmailService
        
        email_service = EmailService()
        test_email = "ishanlahiru2002@gmail.com"
        
        print(f"\n📧 Sending test email to: {test_email}")
        
        # Test simple email
        success = email_service.send_email(
            test_email,
            'Safe Wave Test Email - Email Service Test',
            f'''Hello Ishan!

This is a test email from Safe Wave Backend.

If you receive this email, it means:
✅ SMTP configuration is working
✅ Email service is functional
✅ Your backend can send emails

Email Details:
- To: {test_email}
- From: Safe Wave Backend
- Subject: Test Email

Best regards,
Safe Wave Team 🌊
'''
        )
        
        if success:
            print(f"✅ Test email sent successfully to {test_email}")
            print("📬 Check your inbox (and spam folder)")
            return True
        else:
            print(f"❌ Failed to send test email to {test_email}")
            return False
            
    except Exception as e:
        print(f"❌ Email test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_onboarding_alert_email():
    """Test sending an onboarding analysis alert email"""
    try:
        from app.utils.email_service import EmailService
        
        email_service = EmailService()
        test_email = "ishanlahiru2002@gmail.com"
        
        print(f"\n📧 Sending onboarding alert test email to: {test_email}")
        
        # Sample onboarding analysis data
        sample_analysis = {
            'risk_level': 'medium',
            'urgency_level': 'moderate',
            'key_concerns': ['Anxiety', 'Low mood', 'Sleep issues'],
            'mental_health_indicators': {
                'mood': 'Low',
                'anxiety': 'High',
                'depression': 'Moderate',
                'support_system': 'Limited',
                'crisis_readiness': 'Needs improvement'
            },
            'summary': 'User shows signs of anxiety and depression with limited support system.',
            'recommendations': [
                'Regular check-ins recommended',
                'Consider professional support',
                'Build stronger support network'
            ],
            'care_person_alert': 'User needs regular monitoring and support.'
        }
        
        # Send onboarding analysis alert
        success = email_service.send_onboarding_analysis_alert(
            to_email=test_email,
            user_name="Test User (Ishan)",
            onboarding_analysis=sample_analysis,
            audio_analysis_failed=True
        )
        
        if success:
            print(f"✅ Onboarding alert email sent successfully to {test_email}")
            print("📬 Check your inbox for the alert email")
            return True
        else:
            print(f"❌ Failed to send onboarding alert email to {test_email}")
            return False
            
    except Exception as e:
        print(f"❌ Onboarding alert test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Safe Wave - Custom Email Test for ishanlahiru2002@gmail.com")
    print("=" * 70)
    
    # Test 1: Check email configuration
    print("\n1️⃣ Testing Email Configuration...")
    config_ok = test_email_configuration()
    
    if not config_ok:
        print("\n❌ Email configuration is incomplete!")
        print("   Please set up your .env file with SMTP credentials first.")
        print("   See SMTP_SETUP_GUIDE.md for instructions.")
        return
    
    # Test 2: Send simple test email
    print("\n2️⃣ Testing Simple Email...")
    simple_email_ok = test_simple_email()
    
    # Test 3: Send onboarding alert email
    print("\n3️⃣ Testing Onboarding Alert Email...")
    alert_email_ok = test_onboarding_alert_email()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Results Summary:")
    print(f"   Configuration: {'✅ OK' if config_ok else '❌ FAILED'}")
    print(f"   Simple Email: {'✅ OK' if simple_email_ok else '❌ FAILED'}")
    print(f"   Alert Email: {'✅ OK' if alert_email_ok else '❌ FAILED'}")
    
    if simple_email_ok and alert_email_ok:
        print("\n🎉 All email tests passed! Your email service is working correctly.")
        print("📬 Check ishanlahiru2002@gmail.com for test emails")
    else:
        print("\n⚠️  Some email tests failed. Check the error messages above.")
    
    print("\n🏁 Email test script completed!")

if __name__ == "__main__":
    main()
