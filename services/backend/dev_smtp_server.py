#!/usr/bin/env python3
"""
Development SMTP Server for Safe Wave
This creates a local SMTP server for testing email functionality
"""

import smtpd
import asyncore
import threading
import time
from datetime import datetime

class DevSMTPServer(smtpd.SMTPServer):
    def process_message(self, peer, mailfrom, rcpttos, data, **kwargs):
        print(f"\n{'='*60}")
        print(f"📧 EMAIL RECEIVED at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        print(f"From: {mailfrom}")
        print(f"To: {', '.join(rcpttos)}")
        print(f"Subject: {self.extract_subject(data.decode())}")
        print(f"{'='*60}")
        print("Content:")
        print(data.decode())
        print(f"{'='*60}\n")
        
        # Store email for later retrieval
        self.store_email(mailfrom, rcpttos, data)
    
    def extract_subject(self, email_content):
        """Extract subject from email content"""
        lines = email_content.split('\n')
        for line in lines:
            if line.lower().startswith('subject:'):
                return line[8:].strip()
        return "No Subject"
    
    def store_email(self, mailfrom, rcpttos, data):
        """Store email in memory for testing"""
        if not hasattr(self, 'emails'):
            self.emails = []
        
        email_data = {
            'timestamp': datetime.now(),
            'from': mailfrom,
            'to': rcpttos,
            'content': data.decode(),
            'subject': self.extract_subject(data.decode())
        }
        self.emails.append(email_data)
        print(f"📥 Email stored. Total emails: {len(self.emails)}")

def start_smtp_server(host='localhost', port=1025):
    """Start the development SMTP server"""
    server = DevSMTPServer((host, port), None)
    print(f"🚀 Development SMTP Server started on {host}:{port}")
    print(f"📧 Safe Wave can now send emails to this server")
    print(f"💡 Update your .env file with:")
    print(f"   SMTP_SERVER={host}")
    print(f"   SMTP_PORT={port}")
    print(f"   SMTP_USERNAME=")
    print(f"   SMTP_PASSWORD=")
    print(f"   FROM_EMAIL=noreply@safewave.local")
    print(f"\n📋 To stop the server, press Ctrl+C")
    
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        print(f"\n🛑 SMTP Server stopped")
        if hasattr(server, 'emails'):
            print(f"📊 Total emails received: {len(server.emails)}")
            for i, email in enumerate(server.emails, 1):
                print(f"   {i}. {email['subject']} from {email['from']}")

if __name__ == "__main__":
    start_smtp_server()
