import asyncio
import logging
import os
import uuid
from typing import Any, Dict, List

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.controllers.audio_controller import audio_controller
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.audio import AudioAnalysisRequest, AudioResponse, AudioTranscriptionRequest
from app.views.auth import get_current_user


# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                self.disconnect(user_id)


manager = ConnectionManager()

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=AudioResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    description: str = Form(""),
    mood_rating: int = Form(5),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload audio file with multipart form data"""
    try:
        # Debug logging
        logger.info(f"Upload request received - User: {current_user.id}")
        logger.info(
            f"File info - filename: {file.filename}, content_type: {file.content_type}, size: {file.size}"
        )
        logger.info(f"Form data - description: {description}, mood_rating: {mood_rating}")

        # Validate file
        if not file.filename:
            logger.error("No filename provided")
            raise HTTPException(status_code=400, detail="No file provided")

        # Check file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            logger.error(f"File too large: {file.size} > {settings.MAX_FILE_SIZE}")
            raise HTTPException(status_code=400, detail="File too large")

        # Validate audio format
        allowed_formats = settings.ALLOWED_AUDIO_FORMATS
        file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if file_extension not in allowed_formats:
            logger.error(f"Invalid file format: {file_extension}, allowed: {allowed_formats}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed: {', '.join(allowed_formats)}",
            )

        logger.info(f"File validation passed - extension: {file_extension}")

        # Read file content
        content = await file.read()
        file_size = len(content)
        logger.info(f"File content read - size: {file_size} bytes")

        # Save to local storage
        os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.AUDIO_UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"File saved to: {file_path}")

        # Create audio record
        from app.schemas.audio import AudioCreate

        audio_data = AudioCreate(description=description, mood_rating=mood_rating)

        audio = audio_controller.create_audio(
            db=db,
            audio_data=audio_data,
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            content_type=file.content_type or "audio/wav",
        )

        # Start automatic transcription and analysis pipeline
        background_tasks.add_task(
            _process_audio_pipeline,
            audio.id,
            current_user.id,
            file_path,
            current_user.to_dict(),
            db,
        )

        logger.info(
            f"Audio upload completed and analysis pipeline started for audio ID: {audio.id}"
        )

        # Send immediate status update via WebSocket if connected
        await manager.send_personal_message(
            {
                "type": "audio_uploaded",
                "audio_id": audio.id,
                "status": "uploaded",
                "message": "Audio file uploaded successfully",
            },
            current_user.id,
        )

        return audio.to_dict()

    except Exception as e:
        logger.error(f"Audio upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload audio file")


@router.get("/list", response_model=List[AudioResponse])
async def get_user_audios(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all audio files for current user"""
    try:
        audios = audio_controller.get_user_audios(db, current_user.id)
        return [audio.to_dict() for audio in audios]
    except Exception as e:
        logger.error(f"Failed to get user audios: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audio files")


@router.get("/{audio_id}", response_model=AudioResponse)
async def get_audio(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get specific audio file"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")
        return audio.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audio file")


@router.get("/{audio_id}/stream")
async def stream_audio(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Stream audio file (no download)"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        if not os.path.exists(audio.file_path):
            raise HTTPException(status_code=404, detail="Audio file not found")

        def generate_audio_stream():
            with open(audio.file_path, "rb") as f:
                while chunk := f.read(settings.AUDIO_CHUNK_SIZE):
                    yield chunk

        return StreamingResponse(
            generate_audio_stream(),
            media_type=audio.content_type,
            headers={"Content-Disposition": f"inline; filename={audio.filename}"},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stream audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream audio file")


@router.post("/{audio_id}/transcribe")
async def transcribe_audio(
    audio_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Transcribe audio file using AI"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        if audio.transcription_status == "completed":
            return {"message": "Audio already transcribed", "transcription": audio.transcription}

        # Start transcription in background
        background_tasks.add_task(
            _transcribe_audio_task, audio_id, current_user.id, audio.file_path, db
        )

        return {"message": "Transcription started", "status": "processing"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start transcription: {e}")
        raise HTTPException(status_code=500, detail="Failed to start transcription")


async def _transcribe_audio_task(audio_id: int, user_id: int, file_path: str, db: Session):
    """Background task for audio transcription"""
    try:
        from datetime import datetime

        # Update status to processing
        audio = audio_controller.get_audio(db, audio_id, user_id)
        if audio:
            audio.transcription_status = "processing"
            audio.updated_at = datetime.utcnow()
            db.commit()

        # Transcribe audio
        transcription, confidence, duration = audio_controller.transcribe_audio(file_path)

        # Update database
        audio_controller.update_transcription(
            db, audio_id, user_id, transcription, confidence, duration
        )

    except Exception as e:
        logger.error(f"Transcription failed for audio {audio_id}: {e}")
        # Update status to failed
        try:
            audio = audio_controller.get_audio(db, audio_id, user_id)
            if audio:
                audio.transcription_status = "failed"
                audio.updated_at = datetime.utcnow()
                db.commit()
        except:
            pass


@router.post("/{audio_id}/analyze")
async def analyze_audio(
    audio_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze audio transcription using AI"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        if not audio.transcription:
            raise HTTPException(status_code=400, detail="Audio must be transcribed first")

        if audio.analysis_status == "completed":
            return {
                "message": "Audio already analyzed",
                "analysis": {
                    "risk_level": audio.risk_level,
                    "summary": audio.summary,
                    "recommendations": audio.recommendations,
                },
            }

        # Start analysis in background
        background_tasks.add_task(
            _analyze_audio_task,
            audio_id,
            current_user.id,
            audio.transcription,
            current_user.to_dict(),
            db,
        )

        return {"message": "Analysis started", "status": "processing"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to start analysis")


@router.get("/status/openai")
async def check_openai_status(current_user: User = Depends(get_current_user)):
    """Check OpenAI client status"""
    try:
        from app.controllers.audio_controller import audio_controller

        status = {
            "openai_configured": bool(settings.OPENAI_API_KEY),
            "api_key_length": len(settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else 0,
            "api_key_preview": (
                settings.OPENAI_API_KEY[:20] + "..." if settings.OPENAI_API_KEY else None
            ),
            "client_initialized": audio_controller.openai_client is not None,
            "client_type": (
                str(type(audio_controller.openai_client))
                if audio_controller.openai_client
                else None
            ),
        }

        if audio_controller.openai_client:
            try:
                # Test the client
                models = audio_controller.openai_client.models.list()
                status["test_successful"] = True
                status["available_models"] = len(models.data)
            except Exception as e:
                status["test_successful"] = False
                status["test_error"] = str(e)
        else:
            status["test_successful"] = False
            status["test_error"] = "Client not initialized"

        return status

    except Exception as e:
        logger.error(f"Failed to check OpenAI status: {e}")
        return {"error": str(e)}


@router.get("/status/vosk")
async def check_vosk_status(current_user: User = Depends(get_current_user)):
    """Check Vosk transcription service status"""
    try:
        from app.services.vosk_transcription_service import vosk_transcription_service

        if vosk_transcription_service.is_model_available():
            model_info = vosk_transcription_service.get_model_info()
            return {
                "status": "available",
                "service": "Vosk",
                "message": "Vosk model is loaded and ready for transcription",
                "model_info": model_info,
            }
        else:
            return {
                "status": "unavailable",
                "service": "Vosk",
                "message": "Vosk model is not loaded. Please download a model first.",
                "model_info": vosk_transcription_service.get_model_info(),
            }
    except Exception as e:
        logger.error(f"Vosk status check failed: {e}")
        return {"status": "error", "service": "Vosk", "message": f"Status check failed: {str(e)}"}


@router.get("/{audio_id}/status")
async def get_audio_status(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get audio processing status"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        return {
            "audio_id": audio.id,
            "transcription_status": audio.transcription_status,
            "analysis_status": audio.analysis_status,
            "transcription": audio.transcription,
            "risk_level": audio.risk_level,
            "summary": audio.summary,
            "recommendations": audio.recommendations,
            "transcribed_at": audio.transcribed_at,
            "analyzed_at": audio.analyzed_at,
            "created_at": audio.created_at,
            "updated_at": audio.updated_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get audio status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audio status")


async def _analyze_audio_task(
    audio_id: int, user_id: int, transcription: str, user_data: dict, db: Session
):
    """Background task for audio analysis"""
    try:
        from datetime import datetime

        # Update status to processing
        audio = audio_controller.get_audio(db, audio_id, user_id)
        if audio:
            audio.analysis_status = "processing"
            audio.updated_at = datetime.utcnow()
            db.commit()

        # Analyze transcription
        analysis_data = audio_controller.analyze_with_llm(transcription, user_data)

        # Update database
        audio_controller.update_analysis(db, audio_id, user_id, analysis_data)

    except Exception as e:
        logger.error(f"Analysis failed for audio {audio_id}: {e}")
        # Update status to failed
        try:
            audio = audio_controller.get_audio(db, audio_id, user_id)
            if audio:
                audio.analysis_status = "failed"
                audio.updated_at = datetime.utcnow()
                db.commit()
        except:
            pass

        # Handle audio analysis failure by analyzing onboarding questions
        try:
            logger.info(
                f"Triggering onboarding analysis due to audio analysis failure for audio {audio_id}"
            )
            audio_controller.handle_audio_analysis_failure(db, audio_id, user_id, user_data, str(e))
        except Exception as failure_handler_error:
            logger.error(f"Failed to handle audio analysis failure: {failure_handler_error}")


async def _process_audio_pipeline(
    audio_id: int, user_id: int, file_path: str, user_data: dict, db: Session
):
    """Complete audio processing pipeline: transcription + analysis"""
    try:
        from datetime import datetime

        logger.info(f"Starting audio pipeline for audio ID: {audio_id}")

        # Step 1: Update status to processing
        audio = audio_controller.get_audio(db, audio_id, user_id)
        if audio:
            audio.transcription_status = "processing"
            audio.analysis_status = "pending"
            audio.updated_at = datetime.utcnow()
            db.commit()
            logger.info(f"Audio {audio_id} status updated to processing")

        # Step 2: Transcribe audio
        logger.info("=" * 80)
        logger.info(f"🎤 STEP 2: STARTING TRANSCRIPTION FOR AUDIO {audio_id}")
        logger.info("=" * 80)
        logger.info(f"📁 File path: {file_path}")
        logger.info(f"👤 User ID: {user_id}")
        logger.info(f"👤 User name: {user_data.get('name', 'Unknown')}")

        transcription, confidence, duration = audio_controller.transcribe_audio(file_path)
        logger.info(
            f"✅ Transcription completed for audio {audio_id} with confidence: {confidence}, duration: {duration:.2f}s"
        )

        # Log the actual transcribed text
        logger.info("=" * 80)
        logger.info("📝 AUDIO TRANSCRIPTION CONTENT")
        logger.info("=" * 80)
        logger.info(f'🎯 Transcribed text: "{transcription}"')
        logger.info(f"📊 Text length: {len(transcription)} characters")
        logger.info(f"🔍 Word count: {len(transcription.split()) if transcription else 0}")
        logger.info(f"🎯 Confidence score: {confidence:.4f}")
        logger.info("=" * 80)

        # Step 3: Update transcription in database
        logger.info("=" * 80)
        logger.info(f"💾 STEP 3: SAVING TRANSCRIPTION TO DATABASE FOR AUDIO {audio_id}")
        logger.info("=" * 80)
        audio_controller.update_transcription(
            db, audio_id, user_id, transcription, confidence, duration
        )
        logger.info(
            f"✅ Transcription saved to database for audio {audio_id} with duration: {duration:.2f}s"
        )

        # NEW STEP: Send immediate email alert to care person
        logger.info("=" * 80)
        logger.info(f"📧 STEP 3.5: SENDING IMMEDIATE VOICE ALERT EMAIL FOR AUDIO {audio_id}")
        logger.info("=" * 80)
        try:
            immediate_alert_sent = audio_controller.send_immediate_voice_alert(
                db, audio_id, user_id, user_data, transcription, confidence
            )
            if immediate_alert_sent:
                logger.info(
                    f"✅ Immediate voice alert email sent successfully for audio {audio_id}"
                )
            else:
                logger.warning(f"⚠️ Failed to send immediate voice alert email for audio {audio_id}")
        except Exception as email_error:
            logger.error(f"❌ Error sending immediate voice alert email: {email_error}")
        logger.info("=" * 80)

        # Step 4: Start analysis
        logger.info("=" * 80)
        logger.info(f"🧠 STEP 4: STARTING LLM ANALYSIS FOR AUDIO {audio_id}")
        logger.info("=" * 80)
        logger.info(
            f"📝 Transcription to analyze: \"{transcription[:100]}{'...' if len(transcription) > 100 else ''}\""
        )

        analysis_data = audio_controller.analyze_with_llm(transcription, user_data)
        logger.info(f"✅ LLM analysis completed for audio {audio_id}")

        # Step 5: Update analysis in database
        logger.info("=" * 80)
        logger.info(f"💾 STEP 5: SAVING ANALYSIS TO DATABASE FOR AUDIO {audio_id}")
        logger.info("=" * 80)
        audio_controller.update_analysis(db, audio_id, user_id, analysis_data)
        logger.info(f"✅ Analysis saved to database for audio {audio_id}")

        # Step 6: Final status update
        logger.info("=" * 80)
        logger.info(f"🎯 STEP 6: FINALIZING AUDIO PIPELINE FOR AUDIO {audio_id}")
        logger.info("=" * 80)
        audio = audio_controller.get_audio(db, audio_id, user_id)
        if audio:
            audio.transcription_status = "completed"
            audio.analysis_status = "completed"
            audio.updated_at = datetime.utcnow()
            db.commit()
            logger.info(f"🎉 Audio pipeline completed successfully for audio {audio_id}")
            logger.info(
                f"📊 Final status: transcription={audio.transcription_status}, analysis={audio.analysis_status}"
            )
        logger.info("=" * 80)

    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ AUDIO PIPELINE FAILED FOR AUDIO {audio_id}")
        logger.error("=" * 80)
        logger.error(f"🚫 Error: {e}")
        logger.error(f"🔍 Exception type: {type(e)}")
        logger.error(f"📋 Exception details: {str(e)}")
        logger.error(f"📁 File path: {file_path}")
        logger.error(f"👤 User ID: {user_id}")
        logger.error(f"👤 User name: {user_data.get('name', 'Unknown')}")

        # Update status to failed
        try:
            audio = audio_controller.get_audio(db, audio_id, user_id)
            if audio:
                audio.transcription_status = "failed"
                audio.analysis_status = "failed"
                audio.updated_at = datetime.utcnow()
                db.commit()
                logger.error(f"✅ Audio {audio_id} status updated to failed")
        except Exception as update_error:
            logger.error(f"❌ Failed to update failed status for audio {audio_id}: {update_error}")

        # Handle audio analysis failure by analyzing onboarding questions
        try:
            logger.info("=" * 80)
            logger.info(f"🔄 TRIGGERING ONBOARDING ANALYSIS DUE TO AUDIO PIPELINE FAILURE")
            logger.info("=" * 80)
            logger.info(f"🎤 Audio ID: {audio_id}")
            logger.info(f"👤 User ID: {user_id}")
            logger.info(
                f"📧 Available emails: care_person={user_data.get('carePersonEmail')}, emergency={user_data.get('emergencyContact', {}).get('email')}"
            )

            # Log the transcription that will be used for onboarding analysis
            if transcription:
                logger.info("=" * 80)
                logger.info("📝 TRANSCRIPTION FOR ONBOARDING ANALYSIS")
                logger.info("=" * 80)
                logger.info(f'🎯 Transcribed text: "{transcription}"')
                logger.info(f"📊 Text length: {len(transcription)} characters")
                logger.info(f"🔍 Word count: {len(transcription.split()) if transcription else 0}")
                logger.info("=" * 80)

            success = audio_controller.handle_audio_analysis_failure(
                db, audio_id, user_id, user_data, str(e), transcription
            )

            if success:
                logger.info("✅ Onboarding analysis and email sending completed successfully")
            else:
                logger.warning("⚠️ Onboarding analysis or email sending failed")

        except Exception as failure_handler_error:
            logger.error(f"❌ Failed to handle audio pipeline failure: {failure_handler_error}")
            logger.error(f"🔍 Failure handler error type: {type(failure_handler_error)}")
            logger.error(f"📋 Failure handler error details: {str(failure_handler_error)}")

        logger.error("=" * 80)


@router.post("/test/onboarding-analysis")
async def test_onboarding_analysis(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Test endpoint to trigger onboarding analysis and send email (for testing purposes)"""
    try:
        logger.info(f"Testing onboarding analysis for user {current_user.id}")

        # Trigger onboarding analysis manually
        success = audio_controller.handle_audio_analysis_failure(
            db,
            audio_id=0,  # Dummy ID for testing
            user_id=current_user.id,
            user_data=current_user.to_dict(),
            failure_reason="Manual test trigger",
        )

        if success:
            return {
                "message": "Onboarding analysis completed and emails sent successfully",
                "user_id": current_user.id,
                "care_person_email": current_user.care_person_email,
                "emergency_contact_email": current_user.emergency_contact_email,
                "emails_sent_to": [
                    email
                    for email in [
                        current_user.care_person_email,
                        current_user.emergency_contact_email,
                    ]
                    if email
                ],
            }
        else:
            return {
                "message": "Onboarding analysis failed or no email addresses configured",
                "user_id": current_user.id,
                "care_person_email": current_user.care_person_email,
                "emergency_contact_email": current_user.emergency_contact_email,
                "available_emails": [
                    email
                    for email in [
                        current_user.care_person_email,
                        current_user.emergency_contact_email,
                    ]
                    if email
                ],
            }

    except Exception as e:
        logger.error(f"Test onboarding analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


@router.post("/test/immediate-voice-alert")
async def test_immediate_voice_alert(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Test endpoint for immediate voice alert email sending"""
    try:
        logger.info("=" * 80)
        logger.info("🧪 TESTING IMMEDIATE VOICE ALERT EMAIL SENDING")
        logger.info("=" * 80)
        logger.info(f"👤 User: {current_user.name}")
        logger.info(f"📧 Care person email: {current_user.care_person_email}")
        logger.info(f"🚨 Emergency contact email: {current_user.emergency_contact_email}")

        # Test with sample transcription
        sample_transcription = (
            "I'm feeling really down today. I don't know if I can keep going like this."
        )
        sample_user_data = {
            "name": current_user.name,
            "carePersonEmail": current_user.care_person_email,
            "emergencyContact": {"email": current_user.emergency_contact_email},
        }

        logger.info(f"📝 Sample transcription: {sample_transcription}")

        # Test the immediate voice alert
        success = audio_controller.send_immediate_voice_alert(
            db,
            audio_id=999,  # Dummy ID for testing
            user_id=current_user.id,
            user_data=sample_user_data,
            transcription=sample_transcription,
            confidence=0.85,
        )

        if success:
            logger.info("✅ Immediate voice alert test completed successfully")
            return {
                "success": True,
                "message": "Immediate voice alert test completed",
                "user": {
                    "name": current_user.name,
                    "care_person_email": current_user.care_person_email,
                    "emergency_contact_email": current_user.emergency_contact_email,
                },
                "sample_transcription": sample_transcription,
                "confidence": 0.85,
                "test_audio_id": 999,
            }
        else:
            logger.warning("⚠️ Immediate voice alert test failed")
            return {
                "success": False,
                "message": "Immediate voice alert test failed",
                "user": {
                    "name": current_user.name,
                    "care_person_email": current_user.care_person_email,
                    "emergency_contact_email": current_user.emergency_contact_email,
                },
                "available_emails": [
                    email
                    for email in [
                        current_user.care_person_email,
                        current_user.emergency_contact_email,
                    ]
                    if email
                ],
            }

    except Exception as e:
        logger.error(f"Immediate voice alert test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


@router.delete("/{audio_id}")
async def delete_audio(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete audio file"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        # Delete file if it exists
        if os.path.exists(audio.file_path):
            os.remove(audio.file_path)

        # Delete database record
        db.delete(audio)
        db.commit()

        return {"message": "Audio deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete audio")


# WebSocket endpoint for real-time updates
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time audio processing updates"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)


# Real-time status endpoint
@router.get("/{audio_id}/status")
async def get_audio_status(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get real-time status of audio processing"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        return {
            "audio_id": audio.id,
            "status": "processing",
            "transcription_status": audio.transcription_status,
            "analysis_status": audio.analysis_status,
            "transcription": audio.transcription,
            "risk_level": audio.risk_level,
            "progress": {
                "upload": "completed",
                "transcription": audio.transcription_status,
                "analysis": audio.analysis_status,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get audio status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audio status")


# Real-time transcription updates endpoint
@router.get("/{audio_id}/transcription-live")
async def get_live_transcription(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Stream live transcription updates"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        async def generate_transcription_updates():
            last_transcription = ""
            while True:
                # Get latest transcription
                current_audio = audio_controller.get_audio(db, audio_id, current_user.id)
                if current_audio and current_audio.transcription != last_transcription:
                    last_transcription = current_audio.transcription or ""
                    yield f"data: {JSONResponse(content={'transcription': last_transcription, 'status': current_audio.transcription_status})}\n\n"

                # Check if processing is complete
                if current_audio and current_audio.transcription_status == "completed":
                    break

                await asyncio.sleep(1)  # Update every second

        return StreamingResponse(
            generate_transcription_updates(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stream transcription: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream transcription")


# Audio file serving endpoint
@router.get("/file/{audio_id}")
async def serve_audio_file(
    audio_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Serve audio file for playback"""
    try:
        audio = audio_controller.get_audio(db, audio_id, current_user.id)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        if not audio.file_path or not os.path.exists(audio.file_path):
            raise HTTPException(status_code=404, detail="Audio file not found")

        # Determine content type based on file extension
        file_extension = audio.file_path.split(".")[-1].lower()
        content_type_map = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "m4a": "audio/mp4",
            "aac": "audio/aac",
            "ogg": "audio/ogg",
            "flac": "audio/flac",
            "webm": "audio/webm",
        }
        content_type = content_type_map.get(file_extension, "audio/mpeg")

        return FileResponse(
            audio.file_path,
            media_type=content_type,
            headers={
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve audio file: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve audio file")
