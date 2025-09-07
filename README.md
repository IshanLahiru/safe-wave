# SafeWave — Mental Health Monitoring App (Monorepo)

This is a full-stack, end-to-end project that integrates a React Native mobile application with a FastAPI backend. The mobile app allows users to record short audio check-ins. These recordings are sent to the backend, where speech is transcribed locally using Vosk (offline speech recognition). The backend can then optionally apply AI-based analysis to detect potential risk signals in the content. In addition, the system delivers supportive resources such as videos and articles to the user.

All components—the mobile app, backend, and supporting services—are maintained within a single monorepo, ensuring seamless local development and deployment.

What’s inside
- Mobile app: React Native 0.79.6 + Expo Router (TypeScript)
- Backend API: FastAPI (Python 3.11), SQLAlchemy ORM, Alembic migrations
- Database: PostgreSQL 15 (via Docker)
- Speech-to-text: Vosk small English model bundled in repo
- Auth: JWT (access + refresh) with token blacklist
- Content: Articles, videos, quotes, meal plans + seeding scripts

Repo structure
```
safe-wave/
├─ app/native/                 # React Native + Expo app (TypeScript)
│  ├─ app/                     # Expo Router routes (tabs, auth, etc.)
│  ├─ components/             # UI + audio recorder/player
│  ├─ services/               # API client and config
│  └─ README.md
├─ services/backend/          # FastAPI backend
│  ├─ app/                    # models, views (routers), controllers, core config
│  ├─ alembic/                # DB migrations
│  ├─ models/                 # Vosk speech model (small en-US) already included
│  ├─ scripts/                # seed scripts and utilities
│  ├─ Dockerfile
│  ├─ docker-compose.yml
│  └─ env.example
├─ package.json               # turborepo scripts to run both services
└─ README.md                  # you are here
```

Ports and URLs (local dev)
- Backend API base: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs
- Health: http://localhost:8000/health
- File serving: http://localhost:8000/uploads

Quick start

Option A — Run backend with Docker (recommended for DB)
1) Copy environment:
   cp services/backend/env.example services/backend/.env
   Then open services/backend/.env and change SECRET_KEY, POSTGRES_* and any API keys. Do not commit real secrets.
2) Start DB + API:
   npm run docker:up
   This runs docker-compose in services/backend/ and exposes FastAPI on :8000 and Postgres on :5432.
3) (Optional) Seed demo content:
   From the repo root:
   cd services/backend && npm run seed:content

Option B — Run backend locally (no Docker)
1) Install Poetry if you don’t have it.
2) Install backend deps:
   cd services/backend
   poetry install
3) Create a .env based on env.example and set POSTGRES_* to your local DB.
4) Start dev server (uvicorn reload):
   npm run dev:backend      # or inside backend: poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Run the mobile app
1) Install dependencies:
   cd app/native
   npm install
2) Point the app to your backend:
   npm run update-ip
   This script tries to update the dev IP used by the app. You can also check app/native/services/config.ts for API_CONFIG and getDynamicBaseUrl().
3) Start Expo:
   npx expo start
   Then press i for iOS simulator, a for Android, or open Expo Go on your device and scan the QR.

Minimum prerequisites
- Node.js 18+ and npm
- Python 3.11 + Poetry (if running backend without Docker)
- Docker Desktop (if using Docker option)

Environment variables (backend)
Create services/backend/.env from env.example and set at least:
- POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- SECRET_KEY (at least 32 chars, not a default like “changeme”)
- BACKEND_CORS_ORIGINS or CORS_ORIGINS for your dev hosts
- Optional: OPENROUTER_API_KEY or OPENAI_API_KEY for AI analysis
Notes:
- The example file contains placeholder API keys. Replace them with your own before you run analysis features.
- The app builds DATABASE_URL automatically from the POSTGRES_* fields when not provided.

Database and migrations
- Alembic migrations live in services/backend/alembic/
- Useful scripts (run from repo root):
  - Create new migration: npm run migration:new
  - Apply latest migrations: npm run migration:run
  - View migration history: npm run migration:history
- If you use Docker, the api container runs alembic upgrade head on start.

Vosk speech model
- We use the small English model (vosk-model-small-en-us-0.15).
- The repo already includes a model under services/backend/models/.
- If you change or remove the model, update services accordingly. If no model is present, the service will log a message telling you to download one.

API overview (major routes)
Auth (prefix /auth)
- POST /auth/signup — create user (returns access + refresh tokens)
- POST /auth/login — login (returns access + refresh)
- POST /auth/refresh — exchange refresh for new access + refresh

Health (prefix /health)
- GET /health/ — basic status
- GET /health/performance — DB pool and performance metrics
- GET /health/database-stats — DB statistics and recommendations

Audio (prefix /audio, requires Bearer token)
- POST /audio/upload — multipart/form-data with an audio file
- POST /audio/{id}/transcribe — run transcription (Vosk)
- POST /audio/{id}/analyze — run LLM analysis on the transcription
- GET  /audio/list — list my uploads
- GET  /audio/{id} — single record
- GET  /audio/{id}/stream — streaming bytes
- GET  /audio/{id}/status — current processing status

Documents (prefix /documents, requires Bearer token)
- POST /documents/upload — upload a document (pdf/doc/txt/etc.)
- GET  /documents/list — list my documents
- GET  /documents/{id} — single document meta
- GET  /documents/{id}/download — download the file

Content (prefix /content)
- Auth-free “public” endpoints:
  - GET /content/home-content?featured_limit=5 — homepage content
  - GET /content/videos/public
  - GET /content/articles/public
  - GET /content/meal-plans/public
  - GET /content/quotes/public
- Auth-required variants exist for personalized content too.

Example: sign up and upload audio
1) Sign up:
   curl -X POST http://localhost:8000/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"student@example.com","password":"Password123!","name":"Student"}'
   Save the access_token from the response.
2) Upload an audio file (replace PATH_TO_FILE and TOKEN):
   curl -X POST http://localhost:8000/audio/upload \
     -H "Authorization: Bearer TOKEN" \
     -F "file=@PATH_TO_FILE" \
     -F "description=first check-in" \
     -F "mood_rating=6"
3) Kick off transcription (if not automatic):
   curl -X POST http://localhost:8000/audio/123/transcribe \
     -H "Authorization: Bearer TOKEN"
4) Start analysis:
   curl -X POST http://localhost:8000/audio/123/analyze \
     -H "Authorization: Bearer TOKEN"

Frontend notes (app/native)
- The app tries to detect a good dev base URL automatically. See app/native/services/config.ts for API_CONFIG and the fallback list. If your machine IP is different, run npm run update-ip inside app/native or edit the config file directly.
- On web, it uses http://localhost:8000 by default.

Useful root scripts (package.json)
- npm run dev:all         # run dev for both workspaces
- npm run dev:backend     # backend only
- npm run dev:frontend    # mobile app only
- npm run docker:up       # start backend containers (from services/backend)
- npm run docker:down     # stop backend containers
- Seeding content: cd services/backend && npm run seed:content
- npm run migration:*     # alembic helpers (run, history, etc.)

Security and privacy basics
- Always change SECRET_KEY in your .env (min 32 chars).
- Never commit real API keys. The example values are placeholders.
- Audio files are stored on disk in the backend uploads/ folder; protect the server and restrict CORS for production.

Common troubleshooting
- API says DB is unavailable
  - Make sure Docker is running (if using Option A).
  - Check that POSTGRES_* in .env match docker-compose values.
- Mobile app can’t reach the API
  - Ensure your phone/emulator can reach your machine’s IP on port 8000.
  - Run npm run update-ip in app/native.
- Vosk errors about missing model
  - Verify services/backend/models/vosk-model-small-en-us-0.15 exists. If not, download a model and update the path.

License
Academic/learning use. For production, harden security, secrets management, and infra before deploying.
