# SafeWave Project Detail Documentation

Note: Cover and Title pages are provided as external attachments via email. Insert them when exporting to PDF.

## Preliminary Pages

### i. Cover page
Placeholder: Insert cover page artwork here (per email attachment).

### ii. Title page
Placeholder: Insert title page here (per email attachment).

### iii. Declaration
I hereby declare that this project, titled “SafeWave — Mental Health Monitoring App,” is original work completed for academic and learning purposes. All external libraries, models, and frameworks are credited in the References section. No sensitive data is stored in this repository; secrets must be supplied via environment variables during runtime.

### iv. Acknowledgments
The author acknowledges the open-source communities behind React Native, Expo, FastAPI, SQLAlchemy, Alembic, and Vosk. Special thanks to contributors of the SafeWave repository and documentation resources referenced herein.

### v. Abstract
SafeWave is a full-stack mobile-first system that enables users to perform short audio check-ins, which are then processed by a backend to provide offline transcription and optional AI-assisted risk assessment. The system also delivers supportive resources (articles, videos, quotes, meal plans) to foster mental well-being. The architecture combines a React Native + Expo front end and a FastAPI backend with PostgreSQL, Vosk for offline speech recognition, JWT-based authentication, and optional OpenRouter/OpenAI integration for content analysis. This document details the system’s architecture, methodology, implementation, testing, and requirements for deployment, with emphasis on performance and privacy.

### vi. Table of contents
- Preliminary Pages
  - Cover page
  - Title page
  - Declaration
  - Acknowledgments
  - Abstract
  - Table of contents
  - List of figures
  - List of tables
  - Abbreviations and Symbols
- Chapter 01 Introduction
- Chapter 02 Literature review
- Chapter 03 Methodology
- Chapter 04 System Requirement Specification
- Chapter 05 Implementation / Designing
- Chapter 06 Testing and Evaluation
- Chapter 07 Conclusion
- References
- Appendices

### vii. List of figures
- Figure 1: System Architecture Overview
- Figure 2: Mobile App Layered Architecture
- Figure 3: Backend Service Architecture
- Figure 4: Data Flow — Audio Processing Pipeline
- Figure 5: Deployment Topology (Local Dev with Docker)

### viii. List of tables
- Table 1: Key API Endpoints Summary
- Table 2: Backend Environment Variables Summary

### ix. Abbreviations and Symbols (optional)
- API — Application Programming Interface
- JWT — JSON Web Token
- LLM — Large Language Model
- STT — Speech-To-Text
- ORM — Object Relational Mapping
- SRS — System Requirements Specification
- SPA — Single Page Application (conceptually similar for in-app views)
- CORS — Cross-Origin Resource Sharing

---

## Chapter 01 — Introduction

Mental health monitoring benefits from frequent, lightweight check-ins. SafeWave provides a privacy-conscious solution where a user records short audio updates, which are then analyzed for transcription and optionally for mental health risk signals. Users also receive supportive educational content.

System goals:
- Provide an accessible mobile interface for daily audio check-ins.
- Perform offline speech recognition via Vosk to avoid external transcription dependencies.
- Offer optional AI-based analysis via OpenRouter/OpenAI for risk signal detection.
- Deliver curated content (articles, videos, quotes, meal plans) to support well-being.
- Ensure security via JWT authentication, token refresh, and blacklisting.
- Maintain developer productivity with a monorepo and clearly defined interfaces.

Monorepo overview:
- Mobile app: React Native + Expo Router (TypeScript).
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL.
- Offline STT: Vosk small English model included in-repo.
- Content and utilities: seed scripts, IP update scripts, and docker-compose for local infrastructure.

Repository entry points:
- [README.md](README.md)
- [services/backend/README.md](services/backend/README.md)
- [services/backend/CONFIG.md](services/backend/CONFIG.md)
- [services/backend/app/core/config.py](services/backend/app/core/config.py)
- [app/native/README.md](app/native/README.md)

---

## Chapter 02 — Literature review

1) Mobile mental health monitoring  
- Continuous self-reporting via short, frequent inputs has demonstrated improved user adherence and self-awareness in mental health contexts. Modern mobile apps leverage push notifications, simple UI, and periodic journaling/voice notes.

2) Speech processing for well-being  
- Voice-based features (prosody, sentiment) can correlate with mood states in research settings. Production systems frequently use transcription first (STT), followed by text-based analysis for explainability and cost control. Vosk provides offline STT, enabling privacy-preserving transcription.

3) LLM-assisted assessment  
- LLMs can flag “risk signals” (e.g., self-harm mentions) in transcribed text. SafeWave positions LLMs as optional, emphasizing cost and privacy controls via configuration and a default local/offline-first posture. Structured and conservative prompts, rate limiting, and cost caps are recommended.

4) Backend architecture for reliability  
- FastAPI is common for high-performance Python services with type hints. SQLAlchemy + Alembic provide a robust ORM and migration workflow. JWT-based auth with refresh tokens is a widely adopted pattern for mobile clients.

5) Related technologies (official docs and practice sources)  
- FastAPI, SQLAlchemy, Alembic, PostgreSQL, React Native, Expo, Vosk, and OpenRouter/OpenAI docs are used as primary references. See “References”.

---

## Chapter 03 — Methodology

End-to-end workflow:
1) User records an audio check-in in the mobile app.
2) The app uploads the file via authenticated API to the backend.
3) The backend stores the audio and metadata, then runs offline transcription via Vosk.
4) Optionally, the backend triggers LLM-based analysis on the transcript (if configured).
5) The app queries analysis results and shows supportive content.
6) Users can browse articles/videos/quotes and optionally upload documents for storage.

Data handling:
- Audio stored under an uploads directory, segregated by type.  
- Transcripts stored in database fields.  
- Optional LLM analysis stored as structured JSON (scores, flags, explanations) if enabled.  
- Personalized or public content fetched from content endpoints.

Security posture:
- Access and refresh tokens with rotation and blacklist support.
- CORS restricted to dev hosts locally, configurable for production.
- Secrets supplied through environment variables only; validated on startup.

---

## Chapter 04 — System Requirement Specification (SRS)

Functional requirements:
- User Authentication  
  - Sign up, log in, refresh tokens, token blacklist.  
- Audio Check-ins  
  - Record audio, upload, list history, stream and download.  
  - Transcribe audio locally (Vosk) and show transcript.  
  - Optional analysis for risk signals via LLM.  
- Content Delivery  
  - Fetch public content: home content, videos, articles, meal plans, quotes.  
  - Personalized variants for authenticated users.  
- Document Management  
  - Upload documents, list, download.  
- Health and Monitoring  
  - Health endpoints, performance stats, DB diagnostics.

Non-functional requirements:
- Performance: responsive UI at 60fps where possible; backend endpoints target sub-second responses for common operations (excluding heavy transcription).  
- Reliability: clear migrations and seed scripts; retry and health-check capabilities.  
- Security: JWT, robust SECRET_KEY validation, safe CORS config, rate limiting.  
- Privacy: offline STT by default; AI calls disabled unless explicitly configured.  
- Portability: Docker-based local dev; environment-driven configuration.  
- Observability: structured logging and explicit health endpoints.

Constraints and assumptions:
- Internet connectivity may be intermittent; uploads/retries must be tolerant.  
- Mobile devices vary in performance; UI uses virtualization and memoization.  
- STT model size and performance are bounded by the bundled Vosk “small” model.

---

## Chapter 05 — Implementation / Designing

### 5.1 Monorepo structure
- Mobile app (Expo/TypeScript): [app/native/](app/native/)  
- Backend (FastAPI/Python): [services/backend/](services/backend/)  
- Shared root scripts: [package.json](package.json)

Key backend files:
- Config: [services/backend/app/core/config.py](services/backend/app/core/config.py)  
  - Core settings object [python.Settings()](services/backend/app/core/config.py:11)  
  - Startup factory [python.get_settings()](services/backend/app/core/config.py:560)  
  - DB validation [python.validate_database_connection()](services/backend/app/core/config.py:437)
- API entry: [services/backend/main.py](services/backend/main.py)  
- Routers (views):  
  - Auth: [services/backend/app/views/auth.py](services/backend/app/views/auth.py)  
  - Audio: [services/backend/app/views/audio.py](services/backend/app/views/audio.py)  
  - Documents: [services/backend/app/views/documents.py](services/backend/app/views/documents.py)  
  - Content: [services/backend/app/views/content.py](services/backend/app/views/content.py)  
  - Health: [services/backend/app/views/health.py](services/backend/app/views/health.py)
- Services:  
  - Vosk STT: [services/backend/app/services/vosk_transcription_service.py](services/backend/app/services/vosk_transcription_service.py)  
  - Email alerts: [services/backend/app/services/email_alert_service.py](services/backend/app/services/email_alert_service.py)
- Database:  
  - Alembic migrations: [services/backend/alembic/](services/backend/alembic/)  
  - ORM models: [services/backend/app/models/](services/backend/app/models/)
- Docker & env:  
  - Compose: [services/backend/docker-compose.yml](services/backend/docker-compose.yml)  
  - Dockerfile: [services/backend/Dockerfile](services/backend/Dockerfile)  
  - Env template: [services/backend/env.example](services/backend/env.example)

Key mobile files:
- Routes: [app/native/app/](app/native/app/)  
- Components: [app/native/components/](app/native/components/)  
- API client: [app/native/services/api.ts](app/native/services/api.ts)  
- Config: [app/native/services/config.ts](app/native/services/config.ts)

### 5.2 High-level system architecture

Figure 1: System Architecture Overview

```
┌───────────────┐         HTTPS          ┌───────────────────┐
│  React Native │  ───────────────────▶  │  FastAPI Backend  │
│   (Expo)      │                        │  + Auth + STT     │
└──────┬────────┘                        └─────────┬─────────┘
       │                                         ┌─▼───────────────┐
       │                                         │  PostgreSQL DB   │
       │                                         └──────────────────┘
       │                                         ┌──────────────────┐
       │                                         │  Local Storage    │
       │                                         │  uploads/audio    │
       │                                         │  uploads/documents│
       │                                         └──────────────────┘
       │                                         ┌──────────────────┐
       │ Optional LLM Analysis                   │  OpenRouter/LLM   │
       └────────────────────────────────────────▶│  (if enabled)     │
                                                 └──────────────────┘
```

### 5.3 Mobile app architecture

Figure 2: Mobile App Layered Architecture

```
Presentation (Screens, Components, Navigation)
    └── Business Logic (Hooks, Context, State)
            └── Data Layer (API Services, Storage, File System)
                    └── Platform (Expo AV, FileSystem, DocumentPicker)
```

Design choices:
- Expo Router for file-based navigation and modular screens.
- Performance: FlatList virtualization, memoized components, and native-driver animations.
- Network: API base URL autoconfiguration; IP update utility in [app/native/scripts/update-ip.js](app/native/scripts/update-ip.js).

### 5.4 Backend service architecture

Figure 3: Backend Service Architecture

```
FastAPI App
  ├─ Routers (views): auth, audio, documents, content, health
  ├─ Controllers: business orchestration
  ├─ Services: Vosk STT, email alerts, LLM analysis
  ├─ Models/Schemas: SQLAlchemy ORM + Pydantic schemas
  ├─ Core: configuration, database, security
  ├─ Alembic: migrations
  └─ Uploads: filesystem storage
```

Configuration and security highlights:
- Centralized settings in [python.Settings()](services/backend/app/core/config.py:11) with strict validation for `SECRET_KEY`, `POSTGRES_PASSWORD`, and environment parsing ([python.parse_cors_origins()](services/backend/app/core/config.py:348)).
- Production readiness checks and safe defaults ([services/backend/app/core/config.py](services/backend/app/core/config.py)).
- Environment-driven behavior documented in [services/backend/CONFIG.md](services/backend/CONFIG.md).

### 5.5 Data flow — audio pipeline

Figure 4: Data Flow (Upload → Transcribe → Analyze)

```
Mobile Client
  1) Record (Expo AV) → 2) Upload (multipart/form-data, JWT)

Backend
  3) Store file (uploads/audio) + metadata
  4) Enqueue/trigger offline STT (Vosk small en-US)
  5) Persist transcript in DB
  6) Optional: LLM analysis (OpenRouter) → risk flags/scores

Mobile Client
  7) Fetch results → Render transcript, insights, and supportive content
```

Implementation anchors:
- Upload route: [services/backend/app/views/audio.py](services/backend/app/views/audio.py)  
- STT service: [services/backend/app/services/vosk_transcription_service.py](services/backend/app/services/vosk_transcription_service.py)  
- Content routes: [services/backend/app/views/content.py](services/backend/app/views/content.py)

### 5.6 Deployment topology (local dev)

Figure 5: Local Development with Docker

```
Host Machine
  ├─ Docker (db, api)
  │    ├─ PostgreSQL on :5432
  │    └─ FastAPI on :8000 (or :9000 inside compose mapping)
  └─ Expo Dev Server (Metro bundler)
```

Files:
- [services/backend/docker-compose.yml](services/backend/docker-compose.yml)  
- [services/backend/Dockerfile](services/backend/Dockerfile)

---

## Chapter 06 — Testing and Evaluation

Test strategy:
- Backend API
  - Auth: signup, login, refresh; invalid credentials handling; token expiry/blacklist.
  - Audio: upload, fetch metadata, stream, transcription trigger, analysis trigger (when enabled).
  - Documents: upload/list/download, size/type validation.
  - Content: public endpoints; authenticated variants.
  - Health: health/performance/DB stats endpoints.

- Mobile app
  - UI responsiveness (60fps target on supported devices).
  - Network error handling and offline tolerance.
  - Recording, upload flows, and results rendering.

Representative backend endpoints (see full list in root [README.md](README.md)):
- Auth: `/auth/signup`, `/auth/login`, `/auth/refresh`
- Health: `/health/`, `/health/performance`, `/health/database-stats`
- Audio: `/audio/upload`, `/audio/{id}/transcribe`, `/audio/{id}/analyze`, `/audio/list`, `/audio/{id}`, `/audio/{id}/stream`, `/audio/{id}/status`
- Documents: `/documents/upload`, `/documents/list`, `/documents/{id}/download`
- Content (public): `/content/home-content`, `/content/videos/public`, `/content/articles/public`, `/content/meal-plans/public`, `/content/quotes/public`

Operational checks:
- Configuration validation at startup via [python.get_settings()](services/backend/app/core/config.py:560) and DB connectivity via [python.validate_database_connection()](services/backend/app/core/config.py:437).
- Local development health checks at `http://localhost:8000/health` (default FastAPI port for local run).

Performance notes:
- Mobile: virtualized lists and memoized components reduce RAM usage significantly (see [app/native/README.md](app/native/README.md)).
- Backend: Vosk STT performance depends on device/server CPU; analysis calls are optional and rate-limited by API keys.

---

## Chapter 07 — Conclusion

SafeWave demonstrates a privacy-first, offline-capable architecture for mobile mental health check-ins. By combining offline transcription with optional LLM-based analysis, the system balances accuracy, cost, and user privacy. The monorepo approach streamlines developer workflows, while Docker-based local development enables fast onboarding. Future work includes automated tests (unit/integration), real-time streaming enhancements, and expanded analytics.

---

## References

Primary documentation and libraries:
- FastAPI — https://fastapi.tiangolo.com/
- SQLAlchemy — https://www.sqlalchemy.org/
- Alembic — https://alembic.sqlalchemy.org/
- PostgreSQL — https://www.postgresql.org/
- Pydantic Settings — https://docs.pydantic.dev/latest/concepts/pydantic_settings/
- React Native — https://reactnative.dev/
- Expo — https://expo.dev/
- Vosk — https://alphacephei.com/vosk/
- OpenRouter — https://openrouter.ai/
- JWT (RFC 7519) — https://www.rfc-editor.org/rfc/rfc7519

Project internal docs:
- Root overview and API list: [README.md](README.md)  
- Mobile app overview: [app/native/README.md](app/native/README.md)  
- Backend configuration: [services/backend/CONFIG.md](services/backend/CONFIG.md)

---

## Appendices

### Appendix A — Key API endpoints (summary)
See root [README.md](README.md) for the complete, up-to-date list.

Auth
- POST /auth/signup
- POST /auth/login
- POST /auth/refresh

Health
- GET /health/
- GET /health/performance
- GET /health/database-stats

Audio
- POST /audio/upload
- POST /audio/{id}/transcribe
- POST /audio/{id}/analyze
- GET  /audio/list
- GET  /audio/{id}
- GET  /audio/{id}/stream
- GET  /audio/{id}/status

Documents
- POST /documents/upload
- GET  /documents/list
- GET  /documents/{id}
- GET  /documents/{id}/download

Content (public)
- GET /content/home-content?featured_limit=5
- GET /content/videos/public
- GET /content/articles/public
- GET /content/meal-plans/public
- GET /content/quotes/public

### Appendix B — Environment variables (selected)
- `SECRET_KEY` — required, validated minimum 32 chars; see [services/backend/CONFIG.md](services/backend/CONFIG.md).  
- `POSTGRES_PASSWORD` — required; validated; see [services/backend/app/core/config.py](services/backend/app/core/config.py).  
- `OPENROUTER_API_KEY` / `OPENAI_API_KEY` — optional for LLM features.  
- `CORS_ORIGINS` (alias: `BACKEND_CORS_ORIGINS`) — comma-separated origins.  
- `MAX_FILE_SIZE` — file upload limit (bytes), default 100MB.  
Reference file: [services/backend/env.example](services/backend/env.example)

### Appendix C — Seed and utility scripts
- Content seeding scripts: [services/backend/scripts/](services/backend/scripts/)  
- Network/IP update helper (mobile): [app/native/scripts/update-ip.js](app/native/scripts/update-ip.js)

### Appendix D — Database migrations
- Alembic configuration and migration history: [services/backend/alembic/](services/backend/alembic/)
