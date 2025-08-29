# Safe Wave Backend Implementation

## Overview
A complete FastAPI backend for the Safe Wave mental health application, implementing authentication, user management, and onboarding functionality.

## Architecture
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Architecture**: MVC pattern with clean separation of concerns

## Project Structure
```
services/backend/
├── app/
│   ├── core/           # Configuration and database setup
│   │   ├── config.py   # Environment settings
│   │   └── database.py # Database connection
│   ├── models/         # Database models
│   │   └── user.py     # User model with all fields
│   ├── schemas/        # Pydantic validation schemas
│   │   └── user.py     # Request/response schemas
│   ├── controllers/    # Business logic
│   │   └── user_controller.py # User operations
│   ├── views/          # API endpoints
│   │   ├── auth.py     # Authentication endpoints
│   │   ├── users.py    # User management endpoints
│   │   └── health.py   # Health check endpoint
│   └── utils/          # Utility functions
│       └── auth.py     # JWT and password utilities
├── alembic/            # Database migrations
├── scripts/            # Database seeding
├── requirements.txt    # Python dependencies
├── main.py            # FastAPI application entry point
├── run.py             # Startup script
└── docker-compose.yml # Development environment setup
```

## Key Features

### 1. User Authentication
- **Login**: `POST /auth/login` - JWT-based authentication
- **Signup**: `POST /auth/signup` - User registration
- **Logout**: `POST /auth/logout` - Token invalidation

### 2. User Management
- **Profile**: `GET /users/me` - Get current user profile
- **Update**: `PUT /users/me` - Update user information
- **Preferences**: `PUT /users/preferences` - Update user preferences

### 3. Onboarding System
- **Complete**: `POST /users/onboarding` - Submit onboarding questionnaire
- **Emergency Contacts**: Required emergency contact information
- **Care Person**: Care person email for additional support

### 4. Database Schema
The User model includes:
- Basic info: id, email, name, role
- Onboarding status: is_onboarding_complete
- Emergency contact: name, email, relationship
- Care person: email address
- Preferences: JSON field for app settings
- Onboarding answers: JSON field for questionnaire responses

## API Endpoints

### Authentication Routes
```
POST /auth/login     - User login
POST /auth/signup    - User registration  
POST /auth/logout    - User logout
```

### User Routes
```
GET  /users/me           - Get profile
PUT  /users/me           - Update profile
POST /users/onboarding   - Complete onboarding
PUT  /users/preferences  - Update preferences
```

### Health Routes
```
GET /health - API health status
GET /       - Root endpoint
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost/safewave
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Database Setup
```bash
# Run migrations
alembic upgrade head

# Seed initial data
python scripts/seed_data.py
```

### 4. Start Server
```bash
# Option 1: Direct
python run.py

# Option 2: Uvicorn
uvicorn main:app --reload

# Option 3: Docker
docker-compose up
```

## Demo Users
- **Regular User**: `user@example.com` / `password` (needs onboarding)
- **Healthcare Provider**: `provider@example.com` / `password` (onboarding complete)

## API Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Development Notes

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- CORS middleware for frontend integration
- Environment-based configuration

### Data Validation
- Pydantic schemas for request/response validation
- Email validation for contact fields
- Required field validation for emergency contacts

### Database Features
- PostgreSQL with JSONB fields for flexible data
- Alembic migrations for schema management
- SQLAlchemy ORM for database operations

### Testing
- `test_api.py` script for endpoint testing
- Health check endpoints for monitoring
- Comprehensive error handling

## Next Steps
1. **Production Deployment**: Configure production database and secrets
2. **Additional Features**: Add check-in functionality, analytics endpoints
3. **Testing**: Implement comprehensive test suite
4. **Monitoring**: Add logging and metrics collection
5. **Security**: Implement rate limiting and additional security measures
