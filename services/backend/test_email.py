#!/usr/bin/env python3
"""
Test email functionality for Safe Wave
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def test_email_connection():
    """Test SMTP connection with current settings"""
    
    # Test configurations
    configs = [
        {
            'name': 'Gmail SMTP',
            'server': 'smtp.gmail.com',
            'port': 587,
            'username': os.getenv('SMTP_USERNAME', ''),
            'password': os.getenv('SMTP_PASSWORD', ''),
            'from_email': os.getenv('FROM_EMAIL', 'noreply@safewave.com')
        },
        {
            'name': 'Development SMTP',
            'server': 'localhost',
            'port': 1025,
            'username': '',
            'password': '',
            'from_email': 'noreply@safewave.local'
        }
    ]
    
    print("🧪 Testing SMTP Connections...")
    print("=" * 50)
    
    for config in configs:
        print(f"\n📧 Testing {config['name']}...")
        print(f"   Server: {config['server']}:{config['port']}")
        print(f"   Username: {config['username'] or 'None'}")
        
        try:
            # Test connection
            server = smtplib.SMTP(config['server'], config['port'])
            server.starttls()
            
            if config['username'] and config['password']:
                server.login(config['username'], config['password'])
                print(f"   ✅ Authentication successful")
            else:
                print(f"   ✅ No authentication required")
            
            # Test sending email
            msg = MIMEMultipart()
            msg['From'] = config['from_email']
            msg['To'] = 'test@example.com'
            msg['Subject'] = 'Safe Wave Test Email'
            
            body = f"""
            This is a test email from Safe Wave Backend.
            
            Configuration: {config['name']}
            Server: {config['server']}:{config['port']}
            Timestamp: {__import__('datetime').datetime.now()}
            
            If you receive this, your SMTP is working!
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Try to send (this will fail for invalid recipient, but connection works)
            try:
                server.send_message(msg)
                print(f"   ✅ Email sending test successful")
            except Exception as e:
                if "550" in str(e) or "553" in str(e):
                    print(f"   ✅ Connection successful (recipient rejected as expected)")
                else:
                    print(f"   ⚠️  Connection works but sending failed: {e}")
            
            server.quit()
            print(f"   ✅ {config['name']} is working!")
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
    
    print("\n" + "=" * 50)
    print("📋 Setup Instructions:")
    print("1. For Gmail: Enable 2FA and generate App Password")
    print("2. For Development: Run 'python dev_smtp_server.py' in another terminal")
    print("3. Update your .env file with the working configuration")

if __name__ == "__main__":
    test_email_connection()
