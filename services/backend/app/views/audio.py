import os
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.controllers.audio_controller import AudioController
from app.schemas.audio import AudioAnalysisResponse, AudioUploadRequest
from app.views.auth import get_current_user
from app.models.user import User
from app.core.config import settings
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize audio controller
audio_controller = AudioController()

@router.post("/upload", response_model=AudioAnalysisResponse)
async def upload_audio(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    mood_rating: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload audio file for analysis"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Check file format
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed: {', '.join(settings.ALLOWED_AUDIO_FORMATS)}"
        )
    
    try:
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Get file size
        file_size = len(content)
        
        # Create audio analysis record
        audio_data = {
            "user_id": current_user.id,
            "audio_file_path": file_path,
            "file_size": file_size
        }
        
        audio_analysis = audio_controller.create_audio_analysis(db, audio_data)
        
        # Start background analysis (in production, use Celery or similar)
        # For now, we'll do it synchronously
        try:
            user_data = current_user.to_dict()
            updated_analysis = audio_controller.process_audio_analysis(
                db, audio_analysis.id, user_data
            )
            return updated_analysis.to_dict()
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            # Return the basic record even if analysis fails
            return audio_analysis.to_dict()
            
    except Exception as e:
        logger.error(f"Audio upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload audio file")

@router.get("/analyses", response_model=list[AudioAnalysisResponse])
async def get_user_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all audio analyses for current user"""
    from app.models.audio_analysis import AudioAnalysis
    
    analyses = db.query(AudioAnalysis).filter(
        AudioAnalysis.user_id == current_user.id
    ).order_by(AudioAnalysis.created_at.desc()).all()
    
    return [analysis.to_dict() for analysis in analyses]

@router.get("/analyses/{analysis_id}", response_model=AudioAnalysisResponse)
async def get_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific audio analysis"""
    from app.models.audio_analysis import AudioAnalysis
    
    analysis = db.query(AudioAnalysis).filter(
        AudioAnalysis.id == analysis_id,
        AudioAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis.to_dict()

@router.delete("/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete audio analysis and file"""
    from app.models.audio_analysis import AudioAnalysis
    
    analysis = db.query(AudioAnalysis).filter(
        AudioAnalysis.id == analysis_id,
        AudioAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        # Delete file if it exists
        if os.path.exists(analysis.audio_file_path):
            os.remove(analysis.audio_file_path)
        
        # Delete database record
        db.delete(analysis)
        db.commit()
        
        return {"message": "Analysis deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete analysis")

@router.get("/health")
async def audio_service_health():
    """Check audio service health"""
    return {
        "status": "healthy",
        "whisper_available": audio_controller.whisper_model is not None,
        "openai_available": audio_controller.openai_client is not None,
        "email_service_available": audio_controller.email_service is not None
    }
