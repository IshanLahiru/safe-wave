"""
Audio Service - handles all audio-related business logic.
This service encapsulates audio processing, transcription, and analysis logic.
"""

import logging
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from pathlib import Path

from app.models.audio import Audio
from app.models.user import User
from app.exceptions.base import AudioProcessingError, UserDataError
from app.services.vosk_transcription_service import VoskTranscriptionService
from app.services.openrouter_service import OpenRouterService
from app.utils.openai_service import OpenAIService
from app.core.config import settings

logger = logging.getLogger(__name__)


class AudioService:
    """
    Service class for handling audio-related operations.
    Encapsulates business logic for audio processing, transcription, and analysis.
    """
    
    def __init__(self):
        self.vosk_service = VoskTranscriptionService()
        self.openrouter_service = OpenRouterService()
        self.openai_service = OpenAIService()
    
    def process_audio_file(
        self, 
        db: Session, 
        audio_id: int, 
        user_id: int, 
        file_path: Path
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Process an audio file through the complete pipeline.
        
        Returns:
            Tuple of (success: bool, message: str, analysis_result: Optional[Dict])
        """
        try:
            # Get audio record
            audio = Audio.get_by_id(db, audio_id)
            if not audio:
                raise AudioProcessingError(f"Audio record {audio_id} not found", audio_id=audio_id)
            
            # Get user
            user = User.get_by_id(db, user_id)
            if not user:
                raise UserDataError(f"User {user_id} not found", user_id=user_id)
            
            logger.info(f"🎵 Starting audio processing for {audio.filename}")
            
            # Step 1: Transcribe audio
            transcription_result = self._transcribe_audio(audio, file_path)
            if not transcription_result["success"]:
                return False, transcription_result["message"], None
            
            # Update audio record with transcription
            audio.transcription = transcription_result["transcription"]
            audio.transcription_confidence = transcription_result.get("confidence")
            audio.transcription_status = "completed"
            audio.save(db)
            
            # Step 2: Analyze transcription
            analysis_result = self._analyze_transcription(
                user, transcription_result["transcription"]
            )
            if not analysis_result["success"]:
                return False, analysis_result["message"], None
            
            # Update audio record with analysis
            audio.analysis_status = "completed"
            audio.risk_level = analysis_result["data"].get("risk_level")
            audio.mental_health_indicators = analysis_result["data"].get("mental_health_indicators")
            audio.summary = analysis_result["data"].get("summary")
            audio.recommendations = analysis_result["data"].get("recommendations", [])
            audio.save(db)
            
            logger.info(f"✅ Audio processing completed for {audio.filename}")
            return True, "Audio processed successfully", analysis_result["data"]
            
        except Exception as e:
            logger.error(f"❌ Audio processing failed: {e}", exc_info=True)
            
            # Update audio status to failed
            try:
                audio = Audio.get_by_id(db, audio_id)
                if audio:
                    audio.transcription_status = "failed"
                    audio.analysis_status = "failed"
                    audio.save(db)
            except Exception as update_error:
                logger.error(f"Failed to update audio status: {update_error}")
            
            return False, f"Audio processing failed: {str(e)}", None
    
    def _transcribe_audio(self, audio: Audio, file_path: Path) -> Dict[str, Any]:
        """Transcribe audio file using Vosk"""
        try:
            logger.info(f"🎤 Transcribing audio: {audio.filename}")
            
            # Update status
            audio.transcription_status = "processing"
            
            # Perform transcription
            transcription_result = self.vosk_service.transcribe_audio(str(file_path))
            
            if transcription_result and transcription_result.strip():
                logger.info(f"✅ Transcription completed: \"{transcription_result[:100]}...\"")
                return {
                    "success": True,
                    "transcription": transcription_result,
                    "confidence": 0.8,  # Vosk doesn't provide confidence, using default
                    "message": "Transcription completed successfully"
                }
            else:
                logger.warning("⚠️ Transcription returned empty result")
                return {
                    "success": False,
                    "transcription": "",
                    "message": "Transcription returned empty result - audio might be silent or unclear"
                }
                
        except Exception as e:
            logger.error(f"❌ Transcription failed: {e}")
            return {
                "success": False,
                "transcription": "",
                "message": f"Transcription failed: {str(e)}"
            }
    
    def _analyze_transcription(self, user: User, transcription: str) -> Dict[str, Any]:
        """Analyze transcription for mental health indicators"""
        try:
            logger.info(f"🧠 Analyzing transcription for user {user.name}")
            
            # Choose LLM service based on availability
            if settings.OPENROUTER_API_KEY:
                logger.info("Using OpenRouter for analysis")
                analysis_result = self.openrouter_service.analyze_mental_health(
                    transcription, user.name
                )
            elif settings.OPENAI_API_KEY:
                logger.info("Using OpenAI for analysis")
                analysis_result = self.openai_service.analyze_mental_health(
                    transcription, user.name
                )
            else:
                logger.warning("No LLM service configured, using mock analysis")
                analysis_result = self._create_mock_analysis(transcription)
            
            if analysis_result:
                logger.info(f"✅ Analysis completed - Risk level: {analysis_result.get('risk_level', 'unknown')}")
                return {
                    "success": True,
                    "data": analysis_result,
                    "message": "Analysis completed successfully"
                }
            else:
                logger.error("❌ Analysis returned empty result")
                return {
                    "success": False,
                    "data": None,
                    "message": "Analysis failed - LLM service returned empty result"
                }
                
        except Exception as e:
            logger.error(f"❌ Analysis failed: {e}")
            return {
                "success": False,
                "data": None,
                "message": f"Analysis failed: {str(e)}"
            }
    
    def _create_mock_analysis(self, transcription: str) -> Dict[str, Any]:
        """Create a mock analysis when no LLM service is available"""
        return {
            "risk_level": "low",
            "urgency_level": "low",
            "mental_health_indicators": {
                "mood": "neutral",
                "anxiety": "low",
                "depression": "low",
                "suicidal_ideation": False,
                "self_harm_risk": False
            },
            "key_concerns": [],
            "summary": f"Mock analysis for transcription: {transcription[:100]}...",
            "recommendations": [
                "Continue regular check-ins",
                "Consider speaking with a mental health professional if concerns arise"
            ],
            "transcription": transcription
        }


# Global instance
audio_service = AudioService()
