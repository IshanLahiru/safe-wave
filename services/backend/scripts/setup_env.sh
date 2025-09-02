#!/bin/bash

# Safe Wave API Environment Setup Script
# This script helps you create a .env file with secure values.

echo "🚀 Safe Wave API Environment Setup"
echo "========================================"

# Check if .env already exists
if [ -f ".env" ]; then
    read -p "⚠️  .env already exists. Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
fi

# Generate secure random values
SECRET_KEY=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)

# Create .env file
cat > .env << EOF
# Database Configuration
POSTGRES_DB=safewave
POSTGRES_USER=safewave_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_PORT=5433
DATABASE_URL=postgresql://safewave_user:${DB_PASSWORD}@localhost:5433/safewave

# JWT Configuration
SECRET_KEY=${SECRET_KEY}
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
EOF

if [ $? -eq 0 ]; then
    echo "✅ Created .env file with secure values"
    echo "⚠️  IMPORTANT: Update the following values:"
    echo "   - OPENAI_API_KEY: Set your actual OpenAI API key"
    echo "   - SMTP_USERNAME: Set your email for notifications"
    echo "   - SMTP_PASSWORD: Set your email app password"
    echo "   - Customize database credentials if needed"
    echo ""
    echo "🎉 Environment setup complete!"
    echo "📝 Next steps:"
    echo "   1. Review and update .env with your actual values"
    echo "   2. Run: docker-compose up -d"
    echo "   3. Check logs: docker-compose logs -f api"
else
    echo "❌ Failed to create .env"
    exit 1
fi
