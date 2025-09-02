# Safe Wave - Mental Health Monitoring Platform

A comprehensive mental health monitoring platform built with a modern Turborepo monorepo structure.

## 🏗️ Architecture

This project uses **Turborepo** for efficient monorepo management with the following structure:

```
safe-wave/
├── apps/
│   ├── backend/          # Python FastAPI backend
│   └── frontend/         # React Native (Expo) mobile app
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── package.json          # Root package.json with workspace scripts
├── turbo.json           # Turborepo configuration
└── prettier.config.js   # Shared formatting configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 8+
- **Python** 3.10+
- **PostgreSQL** 12+
- **Expo CLI** (for mobile development)

### 1. Install Dependencies

```bash
# Install all dependencies across the monorepo
npm install
```

### 2. Setup Backend

```bash
# Navigate to backend and set up environment
cd apps/backend
python setup_env.py  # Interactive setup script
pip install -r requirements.txt

# Setup database
alembic upgrade head
```

### 3. Setup Frontend

```bash
# Frontend dependencies are already installed via root npm install
# No additional setup needed for basic development
```

### 4. Start Development

```bash
# Start both backend and frontend in development mode
npm run dev

# Or start them individually:
npm run backend:dev   # Start only backend
npm run frontend:dev  # Start only frontend
```

## 📱 Applications

### Backend (`apps/backend`)

**Tech Stack:** Python, FastAPI, SQLAlchemy, PostgreSQL, Alembic

**Key Features:**
- RESTful API with automatic OpenAPI documentation
- JWT-based authentication with refresh tokens
- Audio transcription using Vosk (offline) 
- Mental health analysis using OpenRouter/OpenAI
- Email notifications for care persons
- File upload handling for audio and documents
- Real-time health monitoring

**Architecture:** MVP (Model-View-Presenter) pattern
- **Models:** Database entities and business logic
- **Views:** FastAPI route handlers and API endpoints  
- **Presenters:** Coordination between views and business logic
- **Services:** External integrations (LLM, email, transcription)

### Frontend (`apps/frontend`)

**Tech Stack:** React Native, Expo, TypeScript

**Key Features:**
- Cross-platform mobile app (iOS/Android/Web)
- Audio recording and playback
- Real-time mental health check-ins
- Onboarding questionnaire
- Care person notifications
- Offline-first architecture

## 🛠️ Development Scripts

### Root Level Commands

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps for production
npm run lint         # Lint all code
npm run format       # Format all code with Prettier
npm run type-check   # Run TypeScript type checking
npm run test         # Run all tests
npm run clean        # Clean all build artifacts
```

### Backend Commands

```bash
cd apps/backend

# Development
python main.py                    # Start development server
python setup_env.py              # Interactive environment setup

# Database
alembic upgrade head              # Run migrations
alembic downgrade base            # Reset database

# Testing & Validation
python test_onboarding_analysis.py  # Test onboarding analysis
python -c "from app.utils.config_validator import get_config_status; print(get_config_status())"

# Health Checks
curl http://localhost:9000/health/        # Basic health check
curl http://localhost:9000/health/config  # Configuration validation
```

### Frontend Commands

```bash
cd apps/frontend

# Development
expo start           # Start Expo development server
expo start --web     # Start web version
expo start --ios     # Start iOS simulator
expo start --android # Start Android emulator

# Building
expo export          # Export for production
```

## 🔧 Configuration

### Backend Configuration

The backend uses environment variables for configuration. Run the setup script for interactive configuration:

```bash
cd apps/backend
python setup_env.py
```

**Required Configuration:**
- **Database:** PostgreSQL connection details
- **JWT:** Secret key for token signing
- **Email:** SMTP settings for notifications
- **LLM:** OpenRouter or OpenAI API keys

**Optional Configuration:**
- **File Storage:** Upload directories and limits
- **Audio Processing:** Transcription and analysis settings

### Frontend Configuration

The frontend automatically detects the backend URL. For custom configuration:

```bash
cd apps/frontend
node scripts/update-ip.js  # Update backend IP for development
```

## 🏥 Health Monitoring

The backend provides comprehensive health monitoring:

- **Basic Health:** `GET /health/` - Simple status check
- **Detailed Health:** `GET /health/detailed` - Database, storage, and service status
- **Configuration Status:** `GET /health/config` - Validation of all configuration

## 🧪 Testing

### Backend Testing

```bash
cd apps/backend

# Test specific components
python test_onboarding_analysis.py
python test_openrouter.py
python test_immediate_alert.py

# Test email configuration
python -c "from app.utils.email_service import EmailService; print(EmailService().send_email('test@example.com', 'Test', 'Test message'))"
```

### Frontend Testing

```bash
cd apps/frontend
npm run test  # Run Jest tests
npm run lint  # Check code quality
```

## 🚀 Deployment

### Backend Deployment

1. **Environment Setup:**
   ```bash
   python setup_env.py  # Configure production environment
   ```

2. **Database Migration:**
   ```bash
   alembic upgrade head
   ```

3. **Start Production Server:**
   ```bash
   python main.py
   ```

### Frontend Deployment

1. **Build for Production:**
   ```bash
   expo export
   ```

2. **Deploy to App Stores:**
   ```bash
   expo build:ios     # iOS App Store
   expo build:android # Google Play Store
   ```

## 🤝 Contributing

1. **Code Style:** We use Prettier for formatting and ESLint for linting
2. **Commits:** Use conventional commit messages
3. **Testing:** Add tests for new features
4. **Documentation:** Update README and inline comments

### Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Start development environment
npm run dev

# 3. Make changes and test
npm run lint
npm run type-check
npm run test

# 4. Format code before committing
npm run format
```

## 📚 Documentation

- **API Documentation:** Available at `http://localhost:9000/docs` when backend is running
- **Backend Setup:** See `apps/backend/README.md`
- **Frontend Setup:** See `apps/frontend/README.md`
- **SMTP Setup:** See `apps/backend/SMTP_SETUP_GUIDE.md`

## 🆘 Troubleshooting

### Common Issues

1. **"Onboarding analysis or email sending failed"**
   - Check email configuration: `curl http://localhost:9000/health/config`
   - Verify SMTP settings in `.env.local`
   - Ensure user has completed onboarding questionnaire

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env.local`
   - Run `alembic upgrade head` to ensure schema is up to date

3. **LLM Analysis Failures**
   - Verify OpenRouter or OpenAI API keys
   - Check API key permissions and quotas
   - Monitor logs for specific error messages

### Getting Help

- Check the health endpoints for configuration issues
- Review logs for detailed error messages
- Ensure all required environment variables are set

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
