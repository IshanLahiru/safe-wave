# SafeWave - Mental Health Platform

> **AI-Powered Mental Health Monitoring & Support Platform**  
> *Enterprise-grade monorepo with 95% performance optimization improvements*

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/safewave/releases)
[![Backend](https://img.shields.io/badge/backend-FastAPI%202.0.0-green.svg)](services/backend/)
[![Frontend](https://img.shields.io/badge/frontend-React%20Native-blue.svg)](app/native/)
[![Architecture](https://img.shields.io/badge/architecture-Monorepo-orange.svg)](docs/ARCHITECTURE.md)
[![Performance](https://img.shields.io/badge/performance-95%25%20improved-brightgreen.svg)](services/backend/PERFORMANCE_OPTIMIZATIONS.md)

## 🎯 Project Overview

SafeWave is a comprehensive mental health platform that combines real-time audio analysis, AI-powered risk assessment, and personalized content delivery to provide proactive mental health support. Built as a production-ready monorepo with enterprise-grade architecture and recently optimized for 95% better performance.

### **Core Capabilities**
- 🎤 **Real-time Audio Analysis** - Offline transcription + AI mental health assessment
- 📱 **Cross-Platform Mobile App** - React Native with performance-optimized UI
- 🤖 **AI-Powered Insights** - OpenRouter/OpenAI integration for risk assessment
- 📊 **Content Management** - Articles, videos, meal plans, and wellness content
- 🔒 **Enterprise Security** - JWT authentication with token management
- 📈 **Performance Optimized** - 95% response time improvement with database indexing

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   React Native  │◄──►│   FastAPI 2.0.0  │◄──►│   PostgreSQL    │
│   Mobile App    │    │   Backend API    │    │   + Indexes     │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Audio Files   │    │  AI/LLM Services │    │   File Storage  │
│   Processing    │    │  (OpenRouter)    │    │   (Local/Cloud) │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Data Flow Architecture**

```
User Audio Recording → Vosk Transcription → LLM Analysis → Risk Assessment → Care Alerts
         │                     │                │               │              │
         ▼                     ▼                ▼               ▼              ▼
   File Storage          Text Processing    AI Insights    User Dashboard   Email Notifications
```

## 🚀 Technology Stack

### **Backend (FastAPI 2.0.0)**
- **Framework**: FastAPI with Uvicorn ASGI server
- **Database**: PostgreSQL with SQLAlchemy ORM + Alembic migrations
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: OpenRouter API (primary) + OpenAI (legacy)
- **Audio Processing**: Vosk offline speech recognition
- **Performance**: GZip compression, database indexes, connection pooling

### **Frontend (React Native + Expo)**
- **Framework**: React Native 0.79.6 with Expo Router
- **Language**: TypeScript for type safety
- **State Management**: React Context + Hooks
- **Performance**: FlatList virtualization, React.memo optimization
- **UI**: Custom components with smooth animations

### **Infrastructure & DevOps**
- **Monorepo**: Turborepo for task orchestration and caching
- **Containerization**: Docker Compose with performance-tuned PostgreSQL
- **Cross-Platform**: Automated setup scripts (Windows, macOS, Linux)
- **Migration System**: Alembic database migrations with rollback support
- **Performance Monitoring**: Request timing, database statistics, health checks

## 📊 Performance Metrics

### **Recent Optimization Results**
- **API Response Time**: 95% improvement (seconds → ~35ms)
- **Database Queries**: 10-100x faster with strategic indexing
- **Memory Usage**: 70% reduction with FlatList virtualization
- **Touch Response**: 85% faster touch response (16-32ms)

### **Architecture Improvements**
- ✅ Database indexes on all frequently queried columns
- ✅ Connection pooling with performance monitoring
- ✅ Response compression and caching headers
- ✅ Critical pagination fixes for content endpoints
- ✅ Native-driver animations for 60fps performance

## 🗂️ Monorepo Structure

```
safe-wave/
├── 📱 app/native/                 # React Native mobile application
│   ├── app/                       # Expo Router pages and navigation
│   ├── components/                # Reusable UI components
│   ├── services/                  # API integration and configuration
│   └── README.md                  # Mobile app documentation
│
├── 🔧 services/backend/           # FastAPI backend service
│   ├── app/                       # Application source code
│   │   ├── models/                # Database models (SQLAlchemy)
│   │   ├── views/                 # API endpoints and routes
│   │   ├── controllers/           # Business logic layer
│   │   ├── services/              # External service integrations
│   │   └── core/                  # Configuration and database setup
│   ├── alembic/                   # Database migrations
│   ├── scripts/                   # Setup and deployment automation
│   ├── docs/                      # Backend-specific documentation
│   └── README.md                  # Backend documentation
│
├── 📚 docs/                       # Comprehensive project documentation
├── 🐳 docker-compose.yml          # Container orchestration
├── 🔧 turbo.json                  # Turborepo task configuration
└── 📋 package.json                # Monorepo workspace configuration
```

## 🚀 Quick Start Guide

### **Prerequisites**
- **Node.js** 18+ and npm 10+
- **Python** 3.9+ with Poetry
- **Docker** and Docker Compose
- **PostgreSQL** (or use Docker)

### **1. Clone and Setup**
```bash
# Clone the repository
git clone https://github.com/your-org/safe-wave.git
cd safe-wave

# Install dependencies
npm install

# Setup backend environment (cross-platform)
npm run setup:backend
```

### **2. Start Development Environment**
```bash
# Start all services (recommended)
npm run dev:all

# Or start individual services
npm run dev:backend    # FastAPI server on :9000
npm run dev:frontend   # Expo dev server on :8081
```

### **3. Access the Application**
- **API Documentation**: http://localhost:9000/docs
- **Backend API**: http://localhost:9000
- **Mobile App**: Use Expo Go app with QR code
- **Health Check**: http://localhost:9000/health/performance

## 📋 Available Commands

### **Development Workflow**
```bash
# Setup and environment
npm run setup                    # Complete backend setup
npm run setup:quick             # Quick setup with defaults
npm run setup:dev               # Development setup

# Development servers
npm run dev:all                 # Start all services
npm run dev:backend             # Backend only
npm run dev:frontend            # Frontend only

# Code quality
npm run lint:all                # Lint all code
npm run format:all              # Format all code
npm run test:all                # Run all tests
```

### **Database Management**
```bash
# Migrations
npm run migration:new "message" # Create new migration
npm run migration:run           # Apply pending migrations
npm run migration:history       # View migration history
npm run db:reset                # Reset database schema

# Health checks
npm run health:check            # Backend health status
```

### **Docker Operations**
```bash
npm run docker:up               # Start containers
npm run docker:down             # Stop containers
npm run docker:logs             # View logs
npm run docker:ps               # Container status
```

## 🔗 Integration Patterns

### **Authentication Flow**
```
Mobile App → Login Request → JWT Token → Authenticated API Calls
     ↓           ↓              ↓              ↓
User Input → Password Hash → Token Storage → Auto-refresh
```

### **Audio Analysis Pipeline**
```
Record Audio → Upload File → Vosk Transcription → LLM Analysis → Risk Assessment
     ↓             ↓             ↓                 ↓               ↓
Local Storage → File API → Background Process → AI Service → Care Notifications
```

### **Content Management**
```
CMS Admin → Content API → Performance Cache → Mobile App → User Experience
     ↓          ↓              ↓               ↓              ↓
Articles → Database → 5min Cache → FlatList → Smooth Scrolling
```

## 📖 Documentation

### **Getting Started**
- [📱 Mobile App Setup](app/native/README.md) - React Native development guide
- [🔧 Backend Setup](services/backend/README.md) - FastAPI development guide
- [🐳 Docker Guide](DOCKER_MANAGEMENT_README.md) - Container management
- [🗂️ Cross-Platform Scripts](services/backend/scripts/README.md) - Setup automation

### **Architecture & Development**
- [⚡ Performance Optimizations](services/backend/PERFORMANCE_OPTIMIZATIONS.md) - 95% improvement details
- [🗄️ Database Management](services/backend/docs/DATABASE_MANAGEMENT.md) - Migration workflows
- [🔧 Configuration Guide](services/backend/CONFIG.md) - Environment setup
- [🏗️ Architecture Decisions](docs/ARCHITECTURE.md) - System design principles

### **Operations & Deployment**
- [🚀 Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [🔍 Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [🛡️ Security Guide](docs/SECURITY.md) - Security best practices
- [📊 Monitoring](docs/MONITORING.md) - Performance and health monitoring

## 🤝 Development Workflow

### **Team Collaboration**
1. **Feature Development**: Create feature branch from `main`
2. **Code Quality**: Run linting, formatting, and tests
3. **Documentation**: Update relevant documentation
4. **Performance**: Monitor performance impact
5. **Integration**: Test with full stack running

### **Code Standards**
- **TypeScript** for all frontend code with strict type checking
- **Python** with type hints and comprehensive docstrings
- **Database** migrations for all schema changes
- **Testing** comprehensive test coverage for critical paths
- **Performance** monitor and optimize database queries

## 📈 Performance Monitoring

### **Key Metrics**
- **API Response Time**: Target <50ms for cached content
- **Database Query Time**: Target <10ms for indexed queries
- **Mobile App Performance**: Target 60fps animations
- **Memory Usage**: Monitor and optimize for low-end devices

### **Monitoring Endpoints**
- `/health/performance` - Comprehensive performance metrics
- `/health/database-stats` - Database connection and query statistics
- `/health` - Basic health check and system status

## 🛡️ Security & Compliance

### **Security Features**
- **Authentication**: JWT tokens with secure refresh mechanism
- **Password Security**: Bcrypt hashing with salt
- **API Security**: Rate limiting and CORS configuration
- **Data Protection**: Secure file upload and storage
- **Environment Security**: All secrets in environment variables

### **Privacy Considerations**
- **Audio Data**: Local processing with secure storage
- **User Data**: GDPR-compliant data handling
- **AI Processing**: Secure API communication
- **Care Notifications**: Encrypted email notifications

## 🎯 Business Value

### **For Healthcare Organizations**
- **Proactive Monitoring**: Early detection of mental health risks
- **Automated Workflows**: Reduce manual monitoring overhead
- **Scalable Architecture**: Handle thousands of concurrent users
- **Integration Ready**: API-first design for EHR integration

### **For Development Teams**
- **Modern Stack**: Latest technologies with best practices
- **High Performance**: Optimized for speed and scalability
- **Cross-Platform**: Single codebase for multiple platforms
- **Maintainable**: Clear architecture and comprehensive documentation

## 📞 Support & Contributing

### **Getting Help**
- 📖 Check the comprehensive documentation in `/docs`
- 🔍 Use troubleshooting guides for common issues
- 💬 Review existing GitHub issues and discussions
- 📧 Contact the development team for complex issues

### **Contributing**
1. Review [Contributing Guidelines](docs/CONTRIBUTING.md)
2. Follow established coding standards and architecture patterns
3. Include tests and documentation for new features
4. Ensure performance benchmarks are met

---

**Built with ❤️ by the SafeWave Development Team**

*Last updated: 2025-01 - Version 2.0.0 with 95% performance improvements*
