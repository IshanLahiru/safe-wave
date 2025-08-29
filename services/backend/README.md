# Safe Wave Backend API

A FastAPI backend for the Safe Wave mental health application, providing authentication, user management, and onboarding functionality.

## Features

- **Authentication**: JWT-based authentication with login/signup
- **User Management**: Complete user profiles with preferences
- **Onboarding**: Questionnaire system with emergency contacts
- **Database**: PostgreSQL with SQLAlchemy ORM
- **API Documentation**: Auto-generated with FastAPI

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment variables**:
   Create `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@localhost/safewave
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

3. **Database setup**:
   ```bash
   alembic upgrade head
   ```

4. **Seed database**:
   ```bash
   python scripts/seed_data.py
   ```

5. **Run the server**:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `POST /users/onboarding` - Complete onboarding

### Health Check
- `GET /health` - API health status

## Demo Users

- **Regular User**: `user@example.com` / `password` (needs onboarding)
- **Healthcare Provider**: `provider@example.com` / `password` (onboarding complete)

## API Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Project Structure

```
services/backend/
├── app/
│   ├── models/          # Database models
│   ├── controllers/     # Business logic
│   ├── views/          # API endpoints
│   ├── schemas/        # Pydantic models
│   ├── core/           # Configuration
│   └── utils/          # Utilities
├── alembic/            # Database migrations
├── scripts/            # Database seeding
├── requirements.txt    # Dependencies
└── main.py            # Application entry point
```
