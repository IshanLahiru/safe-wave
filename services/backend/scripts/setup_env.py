#!/usr/bin/env python3
"""
Environment Setup Script for Safe Wave API
This script helps you create a .env.local file with secure values.
"""

import os
import secrets
import sys

def generate_secret_key():
    """Generate a secure secret key"""
    return secrets.token_urlsafe(32)

def create_env_file():
    """Create .env.local file with secure values"""
    env_content = f"""# Database Configuration
POSTGRES_DB=safewave
POSTGRES_USER=safewave_user
POSTGRES_PASSWORD=safewave_secure_password_{secrets.token_urlsafe(8)}
POSTGRES_PORT=5433
DATABASE_URL=postgresql://safewave_user:safewave_secure_password_{secrets.token_urlsafe(8)}@localhost:5433/safewave

# JWT Configuration
SECRET_KEY={generate_secret_key()}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Safe Wave API
API_PORT=9000

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
USE_LOCAL_MODELS=false
COST_OPTIMIZATION=true

# SMTP Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@safewave.com

# File Upload Configuration
UPLOAD_BASE_DIR=uploads
AUDIO_UPLOAD_DIR=uploads/audio
DOCUMENT_UPLOAD_DIR=uploads/documents
MAX_FILE_SIZE=104857600
ALLOWED_AUDIO_FORMATS=["mp3","wav","m4a","aac","ogg","flac"]
ALLOWED_DOCUMENT_FORMATS=["pdf","doc","docx","txt","rtf"]

# Audio Processing Configuration
AUDIO_CHUNK_SIZE=8192
ENABLE_AUDIO_STREAMING=true
ENABLE_TRANSCRIPTION=true
ENABLE_LLM_ANALYSIS=true
"""
    
    try:
        with open('.env.local', 'w') as f:
            f.write(env_content)
        print("✅ Created .env.local file with secure values")
        print("⚠️  IMPORTANT: Update the following values:")
        print("   - OPENAI_API_KEY: Set your actual OpenAI API key")
        print("   - SMTP_USERNAME: Set your email for notifications")
        print("   - SMTP_PASSWORD: Set your email app password")
        print("   - Customize database credentials if needed")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env.local: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Safe Wave API Environment Setup")
    print("=" * 40)
    
    if os.path.exists('.env.local'):
        response = input("⚠️  .env.local already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("❌ Setup cancelled")
            sys.exit(0)
    
    if create_env_file():
        print("\n🎉 Environment setup complete!")
        print("📝 Next steps:")
        print("   1. Review and update .env.local with your actual values")
        print("   2. Run: docker-compose up -d")
        print("   3. Check logs: docker-compose logs -f api")
    else:
        print("\n❌ Setup failed. Please check the error above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
