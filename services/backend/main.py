import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.models.audio import Audio
from app.models.email_alert import EmailAlert
from app.models.content import (
    Article,
    ContentCategory,
    MealPlan,
    Quote,
    UserFavorite,
    UserProgress,
    Video,
)
from app.models.document import Document
from app.models.token import BlacklistedToken

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.views import analytics, audio, auth, content, documents, health, users

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context: handles startup and shutdown."""
    logger.info("🚀 Starting Safe Wave API...")

    # Create upload directories if they don't exist
    os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)

    logger.info(f"📁 Audio upload directory: {settings.AUDIO_UPLOAD_DIR}")
    logger.info(f"📁 Document upload directory: {settings.DOCUMENT_UPLOAD_DIR}")
    logger.info("✅ Application startup complete!")
    try:
        yield
    finally:
        logger.info("🛑 Shutting down Safe Wave API...")
        logger.info("✅ Application shutdown complete!")

app = FastAPI(
    title="Safe Wave API",
    description="Backend API for Safe Wave mental health application with audio analysis and document management",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup handled via FastAPI lifespan context


# Shutdown handled via FastAPI lifespan context


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500, content={"detail": "Internal server error", "error": str(exc)}
    )


# Mount static files for audio uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(audio.router, prefix="/audio", tags=["audio analysis"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])
app.include_router(content.router, prefix="/content", tags=["content"])


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Safe Wave API is running",
        "version": "2.0.0",
        "features": [
            "Audio recording and analysis",
            "Document upload and processing",
            "Mental health risk assessment",
            "User management and authentication",
        ],
        "endpoints": {
            "health": "/health",
            "auth": "/auth",
            "users": "/users",
            "audio": "/audio",
            "documents": "/documents",
            "docs": "/docs",
        },
        "status": "healthy",
    }


@app.get("/info", tags=["info"])
async def api_info():
    """Get detailed API information"""
    return {
        "name": "Safe Wave API",
        "version": "2.0.0",
        "description": "Mental health application backend with AI-powered analysis",
        "features": {
            "audio_processing": {
                "enabled": settings.ENABLE_AUDIO_STREAMING,
                "transcription": settings.ENABLE_TRANSCRIPTION,
                "llm_analysis": settings.ENABLE_LLM_ANALYSIS,
            },
            "storage": {
                "type": "local",
                "audio_dir": settings.AUDIO_UPLOAD_DIR,
                "document_dir": settings.DOCUMENT_UPLOAD_DIR,
                "max_file_size": f"{settings.MAX_FILE_SIZE / (1024*1024):.1f}MB",
            },
        },
    }


if __name__ == "__main__":
    import uvicorn

    # Server configuration from environment variables
    host = settings.HOST
    port = settings.PORT

    print("🚀 Starting Safe Wave API...")
    print(f"📱 Server will be available at: http://{host}:{port}")
    print(f"📚 API Documentation: http://{host}:{port}/docs")
    print(f"📊 API Info: http://{host}:{port}/info")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)

    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True,
            reload=False,  # Set to True for development
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        logger.error(f"Server failed to start: {e}")
