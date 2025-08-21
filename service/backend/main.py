"""
Safe Wave Backend API

A FastAPI backend for processing audio files and making safety decisions.
Provides endpoints for audio processing with Whisper and LangChain integration.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app with metadata
app = FastAPI(
    title="Safe Wave API",
    description="""
    ## Safe Wave Backend API
    
    This API provides endpoints for processing audio files and making safety decisions.
    
    ### Features:
    - Audio file upload and processing
    - Speech-to-text transcription using Whisper
    - Safety analysis using LangChain
    - Real-time decision making
    
    ### Endpoints:
    - `GET /`: Health check and API status
    - `POST /process-audio/`: Process audio files for safety analysis
    - `GET /docs`: Interactive API documentation (Swagger UI)
    - `GET /redoc`: Alternative API documentation
    """,
    version="1.0.0",
    contact={
        "name": "Safe Wave Team",
        "email": "support@safewave.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to your app domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class AudioProcessResponse(BaseModel):
    """Response model for audio processing endpoint."""
    transcript: str
    decision: str
    confidence: Optional[float] = None
    processing_time: Optional[float] = None
    filename: str

class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    message: str
    version: str
    timestamp: str

@app.get(
    "/",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check if the API is running and get basic information.",
    tags=["Health"]
)
async def root():
    """Root endpoint for health check and API status."""
    from datetime import datetime
    
    return HealthResponse(
        status="healthy",
        message="Safe Wave API is running successfully!",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat()
    )

@app.post(
    "/process-audio/",
    response_model=AudioProcessResponse,
    summary="Process Audio File",
    description="""
    Upload and process an audio file for safety analysis.
    
    The endpoint will:
    1. Accept audio file uploads (MP3, WAV, M4A, etc.)
    2. Transcribe the audio using Whisper
    3. Analyze the content for safety using LangChain
    4. Return a decision with confidence score
    
    **Supported formats**: MP3, WAV, M4A, FLAC, OGG
    **Max file size**: 50MB
    """,
    tags=["Audio Processing"],
    responses={
        200: {
            "description": "Audio processed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "transcript": "Hello, this is a test audio message.",
                        "decision": "SAFE",
                        "confidence": 0.95,
                        "processing_time": 2.34,
                        "filename": "test_audio.mp3"
                    }
                }
            }
        },
        400: {
            "description": "Invalid file format or size",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "File format not supported. Please upload MP3, WAV, M4A, FLAC, or OGG files."
                    }
                }
            }
        },
        413: {
            "description": "File too large",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "File size exceeds maximum limit of 50MB."
                    }
                }
            }
        }
    }
)
async def process_audio(file: UploadFile = File(..., description="Audio file to process")):
    """
    Process an audio file for safety analysis.
    
    Args:
        file: Audio file to process (MP3, WAV, M4A, FLAC, OGG)
        
    Returns:
        AudioProcessResponse: Contains transcript, decision, and metadata
        
    Raises:
        HTTPException: If file format is invalid or file is too large
    """
    # Validate file format
    allowed_formats = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
    file_extension = file.filename.lower().split(".")[-1] if "." in file.filename else ""
    
    if f".{file_extension}" not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"File format not supported. Please upload {', '.join(allowed_formats)} files."
        )
    
    # Validate file size (50MB limit)
    max_size = 50 * 1024 * 1024  # 50MB in bytes
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds maximum limit of 50MB."
        )
    
    try:
        # TODO: Implement actual Whisper + LangChain processing
        # For now, return placeholder data
        import time
        start_time = time.time()
        
        # Simulate processing time
        import asyncio
        await asyncio.sleep(0.1)
        
        processing_time = time.time() - start_time
        
        transcript = f"Transcription of {file.filename} (placeholder)"
        decision = "SAFE"  # TODO: Implement actual safety analysis
        confidence = 0.95  # TODO: Implement actual confidence scoring
        
        logger.info(f"Processed audio file: {file.filename}")
        
        return AudioProcessResponse(
            transcript=transcript,
            decision=decision,
            confidence=confidence,
            processing_time=round(processing_time, 3),
            filename=file.filename
        )
        
    except Exception as e:
        logger.error(f"Error processing audio file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing audio file."
        )

def custom_openapi():
    """Custom OpenAPI schema with additional metadata."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Safe Wave API",
        version="1.0.0",
        description="API for processing audio files and making safety decisions",
        routes=app.routes,
    )
    
    # Add additional metadata
    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
