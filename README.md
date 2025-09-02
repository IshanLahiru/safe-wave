# 🌊 Safe Wave - Mental Health Monitoring Platform

A comprehensive mental health monitoring platform built with modern technologies and MVP architecture. Features voice-based emotion detection, real-time analytics, and cross-platform mobile support.

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** ≥18.0.0
- **Python** ≥3.10.0
- **npm** ≥8.0.0

### **1. Initial Setup (First Time Only)**
```bash
# Clone the repository
git clone <repository-url>
cd safe-wave

# Install all dependencies for the entire monorepo
npm run setup
```

### **2. Development - Run Everything**
```bash
# Start both backend and frontend in development mode
npm run dev
```

### **3. Development - Run Individual Apps**

#### **Backend Only (Python FastAPI)**
```bash
# Run just the backend API server
npm run backend:dev

# Alternative: Navigate to backend directory
cd apps/backend
python main.py
```

#### **Frontend Only (React Native Expo)**
```bash
# Run just the frontend mobile app
npm run frontend:dev

# Alternative: Navigate to frontend directory
cd apps/frontend
expo start
```

### **4. Platform-Specific Frontend**
```bash
# For iOS simulator
cd apps/frontend && npm run ios

# For Android emulator
cd apps/frontend && npm run android

# For web browser
cd apps/frontend && npm run web
```

### **5. Network Access (Mobile Devices)**
```bash
# Setup for access from mobile devices on same WiFi
npm run network:setup

# Start backend accessible from network
npm run backend:network

# Start frontend (in another terminal)
npm run frontend:dev
```

## 🏗️ Project Structure

```
safe-wave/
├── apps/
│   ├── backend/          # Python FastAPI backend with MVP architecture
│   └── frontend/         # React Native (Expo) mobile app
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── package.json          # Root workspace configuration
├── turbo.json           # Turborepo pipeline configuration
└── prettier.config.js   # Shared formatting rules
```

## 📋 Available Scripts

### **Root Level Commands**
```bash
npm run dev           # Start both backend and frontend
npm run build         # Build all applications
npm run lint          # Run linting across all apps
npm run format        # Format code across all apps
npm run type-check    # TypeScript type checking
npm run test          # Run all tests
npm run clean         # Clean build artifacts

# Individual app commands
npm run backend:dev   # Backend development server
npm run frontend:dev  # Frontend development server
npm run backend:build # Build backend only
npm run frontend:build # Build frontend only

# Network access commands
npm run network:ip      # Show local network IP
npm run network:setup   # Configure for network access
npm run backend:network # Start backend on network IP
npm run dev:network     # Setup network + start backend
```

### **Backend-Specific Commands**
```bash
cd apps/backend

# Development & Testing
npm run dev              # Start development server
npm run test             # Run Python tests
npm run test:onboarding  # Test onboarding analysis
npm run test:email       # Test email service
npm run check:config     # Verify configuration

# Database operations
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database

# Utilities
npm run seed:data        # Seed sample data
npm run clean           # Clean Python cache files
```

### **Frontend-Specific Commands**
```bash
cd apps/frontend

# Development
npm run dev             # Start Expo development server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run in web browser

# Build & Deploy
npm run build           # Export for production
npm run clean           # Clean Expo cache

# Utilities
npm run update-ip       # Update API endpoint IP
npm run reset-project   # Reset to clean state
```

## 🎯 What Happens When You Run

- **Backend** starts on `http://localhost:9000` (or network IP)
- **Frontend** starts Expo dev server (usually `http://localhost:8081`)
- **API Documentation** available at `http://localhost:9000/docs`
- **Health Check** available at `http://localhost:9000/health`

### **Network Access**
When using `npm run network:setup`:
- **Backend** becomes accessible at `http://YOUR_IP:9000`
- **Mobile devices** on same WiFi can connect
- **API docs** available at `http://YOUR_IP:9000/docs`

## ✅ First Time Setup Checklist

1. ✅ **Install Prerequisites**: Node.js ≥18, Python ≥3.10, npm ≥8
2. ✅ **Clone Repository**: `git clone <repo-url> && cd safe-wave`
3. ✅ **Run Setup**: `npm run setup` (installs all dependencies)
4. ✅ **Configure Backend**: Create `.env` file in `apps/backend/` (see `.env.example`)
5. ✅ **Start Development**: `npm run dev`
6. ✅ **Open Mobile App**: Use Expo Go app or simulator
7. ✅ **Verify Setup**: Check `http://localhost:9000/health`

### **📱 For Mobile Device Access**
1. ✅ **Setup Network Access**: `npm run network:setup`
2. ✅ **Start Backend**: `npm run backend:network`
3. ✅ **Start Frontend**: `npm run frontend:dev`
4. ✅ **Connect Mobile**: Use Expo Go app with network IP
5. ✅ **Same WiFi**: Ensure devices are on same network

## 🔧 Configuration

### **Backend Environment Variables**
Create `apps/backend/.env` file:
```env
# Database
DATABASE_URL=sqlite:///./safe_wave.db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Service
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI/ML Integration
OPENROUTER_API_KEY=your-openrouter-key

# Environment
ENVIRONMENT=development
DEBUG=true
```

### **Frontend Configuration**
The frontend automatically detects your local IP for API communication. If needed, update `apps/frontend/services/config.ts`.

## 🚀 Features

- **🧠 Mental Health Monitoring**: Track mood, stress levels, and well-being
- **🎤 Audio Analysis**: Voice-based emotion detection using AI
- **🔐 User Authentication**: Secure JWT-based login and registration
- **📊 Real-time Analytics**: Dashboard with insights and trends
- **📱 Cross-platform**: Works on iOS, Android, and web
- **🏥 Health Checks**: Comprehensive system monitoring
- **📧 Email Notifications**: Automated email service integration
- **🎨 Modern UI**: Clean, accessible interface with haptic feedback

## 🛠️ Technology Stack

### **Backend**
- **FastAPI**: Modern Python web framework with automatic API docs
- **SQLAlchemy**: Database ORM with Alembic migrations
- **Pydantic**: Data validation and settings management
- **OpenRouter**: AI/ML integration for audio analysis
- **JWT**: Secure authentication tokens
- **SMTP**: Email service integration

### **Frontend**
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript development
- **Expo Router**: File-based routing system
- **Async Storage**: Local data persistence
- **Expo AV**: Audio recording and playback

### **Development Tools**
- **Turborepo**: Intelligent monorepo build system with caching
- **ESLint**: Code linting with Expo configuration
- **Prettier**: Consistent code formatting
- **Jest**: Testing framework for JavaScript/TypeScript
- **pytest**: Testing framework for Python

## 🏗️ Architecture

### **MVP Pattern (Backend)**
- **Models**: Data layer with SQLAlchemy ORM
- **Views**: API endpoints with FastAPI
- **Presenters**: Business logic coordination layer

### **Component Architecture (Frontend)**
- **Screens**: Main application screens
- **Components**: Reusable UI components
- **Services**: API communication and utilities
- **Contexts**: State management (Auth, User)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests only
cd apps/backend && npm run test

# Frontend tests only
cd apps/frontend && npm run test

# Specific backend tests
cd apps/backend
npm run test:onboarding  # Test onboarding analysis
npm run test:email       # Test email service
```

## 🔍 Troubleshooting

### **Common Issues**

1. **"Module not found" errors**: Run `npm run setup` to reinstall dependencies
2. **Backend won't start**: Check Python version and run `pip install -r requirements.txt`
3. **Frontend connection issues**: Run `npm run update-ip` in frontend directory
4. **Database errors**: Run `npm run db:reset` in backend directory
5. **Expo issues**: Run `npm run clean` in frontend directory

### **Health Checks**
- Backend health: `http://localhost:9000/health`
- Network health: `http://YOUR_IP:9000/health` (after network setup)
- Configuration check: `cd apps/backend && npm run check:config`

## 📚 Documentation

- **API Documentation**: `http://localhost:9000/docs` (when backend is running)
- **Network Setup**: `NETWORK_SETUP.md` - Complete guide for mobile device access
- **Implementation Guides**: See `apps/frontend/` for detailed guides:
  - `AUDIO_ANALYSIS_IMPLEMENTATION.md`
  - `CHECKIN_UI_DEMO.md`
  - `PERFORMANCE_OPTIMIZATIONS.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the established patterns
4. Run tests and linting: `npm run test && npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
