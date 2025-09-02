# Safe Wave Backend API

A FastAPI backend for the Safe Wave mental health application, providing authentication, user management, audio analysis, and document management functionality.

## Features

- **Authentication**: JWT-based authentication with login/signup/refresh
- **User Management**: Complete user profiles with preferences and onboarding
- **Audio Analysis**: Offline audio transcription using Vosk + AI-powered mental health risk assessment
- **Onboarding Analysis**: AI analysis of onboarding questionnaires when audio analysis fails
- **Care Person Alerts**: Automatic email notifications to care persons with mental health assessments
- **Document Management**: Secure file upload and storage
- **Database**: PostgreSQL with SQLAlchemy ORM
- **API Documentation**: Auto-generated with FastAPI

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Token Blacklisting**: Secure logout with token revocation
- **File Validation**: Secure file upload with type and size validation
- **Environment-based Configuration**: No hardcoded secrets

## Setup

### 1. **Environment Setup** (Required)

**Option A: Use the setup script (Recommended)**
```bash
cd services/backend
python scripts/setup_env.py
```

**Option B: Manual setup**
Create `.env` file with the following variables:
```env
# Database Configuration
POSTGRES_DB=safewave
POSTGRES_USER=safewave_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5433
DATABASE_URL=postgresql://safewave_user:your_secure_password@localhost:5433/safewave

# JWT Configuration
SECRET_KEY=your_secure_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_PORT=9000

# OpenAI Configuration (for audio analysis)
OPENAI_API_KEY=your_openai_api_key_here

# SMTP Configuration (for notifications)
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

### 3. **Set up Vosk for offline transcription**:
```bash
# Download a Vosk model (recommended for development)
python scripts/download_vosk_model.py vosk-model-small-en-us-0.15

# Or download a larger, more accurate model for production
python scripts/download_vosk_model.py vosk-model-en-us-0.22
```

**Available Models:**
- `vosk-model-small-en-us-0.15` (~42 MB) - Fast, good for development
- `vosk-model-en-us-0.22` (~1.6 GB) - Accurate, good for production
- `vosk-model-small-en-us-0.15-lgraph` (~42 MB) - Better vocabulary coverage

### 4. **Database setup**:
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Run migrations
alembic upgrade head
```

### 5. **Seed database** (Optional):
```bash
python scripts/seed_data.py
```

### 6. **Run the server**:
```bash
# Using Docker (Recommended)
docker-compose up -d

# Or directly with uvicorn
uvicorn main:app --reload --port 9000
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_DB` | Database name | `safewave` | Yes |
| `POSTGRES_USER` | Database user | `safewave_user` | Yes |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `SECRET_KEY` | JWT secret key | Auto-generated | Yes |
| `OPENAI_API_KEY` | OpenAI API key for audio analysis | - | No* |
| `SMTP_USERNAME` | Email username for notifications | - | No* |

*Required for full functionality

## Onboarding Analysis & Care Person Alerts

### Overview
When audio analysis fails, the system automatically falls back to analyzing the user's onboarding questionnaire answers to assess mental health risk and notify care persons.

### How It Works
1. **Audio Analysis Failure Detection**: System detects when audio transcription or LLM analysis fails
2. **Onboarding Question Analysis**: AI analyzes the user's onboarding questionnaire responses
3. **Risk Assessment**: Generates comprehensive mental health risk assessment
4. **Care Person Notification**: Sends detailed email alert to the user's designated care person
5. **Fallback Safety Net**: Ensures mental health monitoring continues even when audio fails

### Key Components
- **OnboardingAnalysisService**: AI-powered analysis of questionnaire responses
- **EmailService**: Professional email notifications with mental health insights
- **Failure Handling**: Automatic fallback in audio processing pipeline
- **Risk Classification**: Low/Medium/High/Critical risk levels with actionable insights

### Testing
Use the test endpoint to manually trigger onboarding analysis:
```bash
POST /audio/test/onboarding-analysis
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `POST /users/onboarding` - Complete onboarding
- `PUT /users/preferences` - Update user preferences

### Audio Analysis
- `POST /audio/upload` - Upload audio file
- `GET /audio/list` - List user audio files
- `POST /audio/{id}/transcribe` - Transcribe audio
- `POST /audio/{id}/analyze` - Analyze audio for mental health risks

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents/list` - List user documents
- `GET /documents/{id}` - Get document details
- `DELETE /documents/{id}` - Delete document

### Health Check
- `GET /health` - API health status

## Demo Users

- **Regular User**: `user@example.com` / `password` (needs onboarding)
- **Healthcare Provider**: `provider@example.com` / `password` (onboarding complete)

## API Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: `http://localhost:9000/docs`
- **ReDoc**: `http://localhost:9000/redoc`
- **API Info**: `http://localhost:9000/info`

## Project Structure

```
services/backend/
├── app/
│   ├── models/          # Database models
│   ├── controllers/     # Business logic
│   ├── views/          # API endpoints
│   ├── schemas/        # Pydantic models
│   ├── core/           # Configuration & database
│   ├── services/       # External services (MinIO, OpenAI)
│   └── utils/          # Utilities & authentication
├── alembic/            # Database migrations
├── scripts/            # Setup & database seeding
├── uploads/            # File storage
├── docker-compose.yml  # Docker services
├── requirements.txt    # Dependencies
└── main.py            # Application entry point
```

## Security Considerations

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong passwords** for database and JWT secrets
3. **Rotate secrets regularly** in production
4. **Restrict CORS origins** in production environments
5. **Enable HTTPS** in production
6. **Monitor file uploads** for malicious content

## Troubleshooting

### Common Issues

1. **Database connection failed**: Check PostgreSQL is running and credentials are correct
2. **JWT errors**: Ensure SECRET_KEY is set and not the default value
3. **File upload fails**: Check upload directory permissions and file size limits
4. **Audio analysis fails**: Verify OpenAI API key is set correctly

### Logs

```bash
# View API logs
docker-compose logs -f api

# View database logs
docker-compose logs -f postgres
```
