import os
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.audio import Audio
from app.schemas.audio import AudioCreate, AudioUpdate
from app.core.config import settings
from app.services.onboarding_analysis_service import onboarding_analysis_service
from app.services.vosk_transcription_service import vosk_transcription_service
from app.services.openrouter_service import openrouter_service
from app.utils.email_service import EmailService
import openai

logger = logging.getLogger(__name__)

class AudioController:
    def __init__(self):
        self.openai_client = None
        self._initialize_openai()
    
    def _initialize_openai(self):
        if settings.OPENAI_API_KEY:
            try:
                logger.info(f"Initializing OpenAI client with API key: {settings.OPENAI_API_KEY[:20]}...")
                logger.info(f"OpenAI version: {openai.__version__}")
                
                # Handle different OpenAI versions
                if hasattr(openai, 'OpenAI'):
                    # Newer version (1.58.1+)
                    self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                    logger.info("OpenAI client initialized successfully (new version)")
                    
                    # Test the client
                    logger.info("Testing OpenAI client...")
                    test_response = self.openai_client.models.list()
                    logger.info(f"OpenAI client test successful - Available models: {len(test_response.data)}")
                    
                else:
                    # Older version (1.3.0)
                    openai.api_key = settings.OPENAI_API_KEY
                    self.openai_client = openai
                    logger.info("OpenAI client initialized successfully (old version)")
                    
                    # Test the client
                    logger.info("Testing OpenAI client...")
                    test_response = openai.Model.list()
                    logger.info(f"OpenAI client test successful - Available models: {len(test_response.data)}")
                
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                logger.error(f"OpenAI client type: {type(openai)}")
                logger.error(f"OpenAI version: {openai.__version__ if hasattr(openai, '__version__') else 'Unknown'}")
                self.openai_client = None
        else:
            logger.warning("OpenAI API key not configured")
            self.openai_client = None
    
    def create_audio(self, db: Session, audio_data: AudioCreate, user_id: int, 
                    filename: str, file_path: str, file_size: int, content_type: str) -> Audio:
        try:
            db_audio = Audio(
                user_id=user_id,
                filename=filename,
                file_path=file_path,
                file_size=file_size,
                content_type=content_type,
                description=audio_data.description,
                mood_rating=audio_data.mood_rating,
                tags=audio_data.tags or []
            )
            db.add(db_audio)
            db.commit()
            db.refresh(db_audio)
            return db_audio
        except Exception as e:
            logger.error(f"Failed to create audio record: {e}")
            db.rollback()
            raise
    
    def get_user_audios(self, db: Session, user_id: int) -> list[Audio]:
        return db.query(Audio).filter(Audio.user_id == user_id).order_by(Audio.created_at.desc()).all()
    
    def get_audio(self, db: Session, audio_id: int, user_id: int) -> Optional[Audio]:
        return db.query(Audio).filter(Audio.id == audio_id, Audio.user_id == user_id).first()
    
    def transcribe_audio(self, audio_file_path: str) -> Tuple[str, float, float]:
        """Transcribe audio using Vosk offline speech recognition"""
        try:
            logger.info(f"🎤 Starting Vosk transcription of file: {audio_file_path}")
            logger.info(f"📁 File path: {os.path.abspath(audio_file_path)}")
            
            # Check file size
            if os.path.exists(audio_file_path):
                file_size = os.path.getsize(audio_file_path)
                logger.info(f"📊 File size: {file_size} bytes ({file_size/1024:.2f} KB)")
            
            # Check if Vosk model is available
            if not vosk_transcription_service.is_model_available():
                logger.error("❌ Vosk model not available - cannot transcribe audio")
                raise Exception("Vosk model not available. Please download a Vosk model first.")
            
            logger.info("✅ Vosk model is available and ready")
            
            # Use Vosk for transcription
            logger.info("🔄 Starting Vosk transcription process...")
            transcription, confidence, duration = vosk_transcription_service.transcribe_audio(audio_file_path)
            
            # Detailed transcription logging
            logger.info("=" * 80)
            logger.info("🎯 TRANSCRIPTION COMPLETED SUCCESSFULLY")
            logger.info("=" * 80)
            logger.info(f"📝 Transcription text: \"{transcription}\"")
            logger.info(f"📊 Text length: {len(transcription)} characters")
            logger.info(f"🎯 Confidence score: {confidence:.4f}")
            logger.info(f"📈 Confidence percentage: {confidence*100:.2f}%")
            logger.info(f"🔍 Word count: {len(transcription.split()) if transcription else 0}")
            logger.info(f"⏱️ Audio duration: {duration:.2f} seconds")
            logger.info("=" * 80)
            
            return transcription, confidence, duration
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error("❌ VOSK TRANSCRIPTION FAILED")
            logger.error("=" * 80)
            logger.error(f"🚫 Error: {e}")
            logger.error(f"🔍 Exception type: {type(e)}")
            logger.error(f"📋 Exception details: {str(e)}")
            logger.error(f"📁 File path: {audio_file_path}")
            logger.error("=" * 80)
            raise Exception(f"Audio transcription failed: {str(e)}")
    
    def analyze_with_llm(self, transcription: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transcription using OpenRouter LLM for mental health risk assessment"""
        
        try:
            logger.info("=" * 80)
            logger.info("🧠 STARTING OPENROUTER LLM ANALYSIS")
            logger.info("=" * 80)
            logger.info(f"📝 Transcription length: {len(transcription)} characters")
            logger.info(f"📊 Transcription preview: \"{transcription[:100]}{'...' if len(transcription) > 100 else ''}\"")
            logger.info(f"👤 User data keys: {list(user_data.keys())}")
            logger.info(f"👤 User name: {user_data.get('name', 'Unknown')}")
            logger.info(f"📧 Care person email: {user_data.get('carePersonEmail', 'None')}")
            logger.info(f"🚨 Emergency contact: {user_data.get('emergencyContact', {}).get('email', 'None')}")
            
            # Check if OpenRouter is available
            if not openrouter_service.is_available():
                logger.error("❌ OpenRouter service not available")
                raise Exception("OpenRouter service not available - API key not configured")
            
            # Use OpenRouter for analysis
            logger.info("🔄 Calling OpenRouter API for mental health analysis...")
            analysis_data = openrouter_service.analyze_mental_health(transcription, user_data)
            
            logger.info("=" * 80)
            logger.info("🎯 OPENROUTER ANALYSIS COMPLETED SUCCESSFULLY")
            logger.info("=" * 80)
            logger.info(f"📊 Risk level: {analysis_data.get('risk_level', 'unknown')}")
            logger.info(f"⚠️ Urgency level: {analysis_data.get('urgency_level', 'unknown')}")
            logger.info(f"📝 Summary: {analysis_data.get('summary', '')[:100]}...")
            logger.info(f"🔍 Key concerns count: {len(analysis_data.get('key_concerns', []))}")
            logger.info(f"💡 Recommendations count: {len(analysis_data.get('recommendations', []))}")
            logger.info(f"🚨 Crisis intervention needed: {analysis_data.get('crisis_intervention_needed', False)}")
            logger.info("=" * 80)
            
            return analysis_data
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error("❌ OPENROUTER ANALYSIS FAILED")
            logger.error("=" * 80)
            logger.error(f"🚫 Error: {e}")
            logger.error(f"🔍 Exception type: {type(e)}")
            logger.error(f"📋 Exception details: {str(e)}")
            logger.error(f"📝 Transcription: \"{transcription[:100]}{'...' if len(transcription) > 100 else ''}\"")
            logger.error("=" * 80)
            raise Exception(f"OpenRouter analysis failed: {str(e)}")
    
    def update_transcription(self, db: Session, audio_id: int, user_id: int, 
                           transcription: str, confidence: float, duration: float) -> Audio:
        try:
            audio = self.get_audio(db, audio_id, user_id)
            if not audio:
                raise Exception("Audio not found")
            
            audio.transcription = transcription
            audio.transcription_confidence = confidence
            audio.duration = duration
            audio.transcription_status = "completed"
            audio.transcribed_at = datetime.utcnow()
            audio.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(audio)
            return audio
            
        except Exception as e:
            logger.error(f"Failed to update transcription: {e}")
            db.rollback()
            raise
    
    def update_analysis(self, db: Session, audio_id: int, user_id: int, 
                       analysis_data: Dict[str, Any]) -> Audio:
        try:
            audio = self.get_audio(db, audio_id, user_id)
            if not audio:
                raise Exception("Audio not found")
            
            audio.risk_level = analysis_data.get("risk_level")
            audio.mental_health_indicators = analysis_data.get("mental_health_indicators")
            audio.summary = analysis_data.get("summary")
            audio.recommendations = analysis_data.get("recommendations")
            audio.analysis_status = "completed"
            audio.analyzed_at = datetime.utcnow()
            audio.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(audio)
            return audio
            
        except Exception as e:
            logger.error(f"Failed to update analysis: {e}")
            db.rollback()
            raise
    
    def send_immediate_voice_alert(self, db: Session, audio_id: int, user_id: int, 
                                  user_data: Dict[str, Any], transcription: str, confidence: float) -> bool:
        """Send immediate email alert to care person when user uploads voice audio"""
        try:
            logger.info("=" * 80)
            logger.info("📧 SENDING IMMEDIATE VOICE ALERT EMAIL")
            logger.info("=" * 80)
            logger.info(f"🎤 Audio ID: {audio_id}")
            logger.info(f"👤 User ID: {user_id}")
            logger.info(f"👤 User name: {user_data.get('name', 'Unknown')}")
            logger.info(f"🎯 Transcription: \"{transcription}\"")
            logger.info(f"📊 Confidence: {confidence:.4f}")
            
            # Get user from database to ensure we have latest data
            from app.models.user import User
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"❌ User {user_id} not found in database")
                return False
            
            # Collect all available email addresses
            emails_to_send = []
            email_types = []
            
            # Add care person email if available
            if user.care_person_email:
                emails_to_send.append(user.care_person_email)
                email_types.append("care person")
                logger.info(f"📧 Care person email found: {user.care_person_email}")
            else:
                logger.warning(f"⚠️ No care person email configured for user {user_id}")
            
            # Add emergency contact email if available
            if user.emergency_contact_email:
                emails_to_send.append(user.emergency_contact_email)
                email_types.append("emergency contact")
                logger.info(f"📧 Emergency contact email found: {user.emergency_contact_email}")
            else:
                logger.warning(f"⚠️ No emergency contact email configured for user {user_id}")
            
            if not emails_to_send:
                logger.error(f"❌ No email addresses available for user {user_id}")
                return False
            
            # Send immediate voice alert emails
            emails_sent = 0
            email_service = EmailService()
            
            for email, email_type in zip(emails_to_send, email_types):
                try:
                    # Log the transcription being sent in this email
                    logger.info("=" * 80)
                    logger.info(f"📧 SENDING IMMEDIATE VOICE ALERT TO {email_type.upper()}")
                    logger.info("=" * 80)
                    logger.info(f"📧 Email: {email}")
                    logger.info(f"👤 User: {user.name}")
                    logger.info(f"🎯 Transcribed text: \"{transcription}\"")
                    logger.info(f"📊 Text length: {len(transcription)} characters")
                    logger.info("=" * 80)
                    
                    # Send immediate voice alert
                    email_sent = email_service.send_immediate_voice_alert(
                        to_email=email,
                        user_name=user.name,
                        transcription=transcription,
                        confidence=confidence,
                        audio_id=audio_id,
                        recipient_type=email_type
                    )
                    
                    if email_sent:
                        logger.info(f"✅ Immediate voice alert sent successfully to {email_type}: {email}")
                        emails_sent += 1
                    else:
                        logger.error(f"❌ Failed to send immediate voice alert to {email_type}: {email}")
                        
                except Exception as e:
                    logger.error(f"❌ Error sending immediate voice alert to {email_type} {email}: {e}")
            
            logger.info(f"📊 Immediate voice alert emails sent: {emails_sent}/{len(emails_to_send)}")
            logger.info("=" * 80)
            
            return emails_sent > 0
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error("❌ IMMEDIATE VOICE ALERT FAILED")
            logger.error("=" * 80)
            logger.error(f"🚫 Error: {e}")
            logger.error(f"🔍 Exception type: {type(e)}")
            logger.error(f"📋 Exception details: {str(e)}")
            logger.error("=" * 80)
            return False
    
    def handle_audio_analysis_failure(self, db: Session, audio_id: int, user_id: int, 
                                    user_data: Dict[str, Any], failure_reason: str, transcription: str = None) -> bool:
        """Handle audio analysis failure by analyzing onboarding questions and sending email alert"""
        try:
            logger.info(f"Handling audio analysis failure for audio {audio_id}, user {user_id}")
            
            # Get user's onboarding answers
            from app.models.user import User
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.onboarding_answers:
                logger.warning(f"No onboarding answers found for user {user_id}")
                return False
            
            # Analyze onboarding questions
            logger.info(f"Analyzing onboarding questions for user {user_id}")
            
            # Log the transcription being used for analysis
            if transcription:
                logger.info("=" * 80)
                logger.info("📝 USING TRANSCRIPTION FOR ONBOARDING ANALYSIS")
                logger.info("=" * 80)
                logger.info(f"🎯 Transcribed text: \"{transcription}\"")
                logger.info(f"📊 Text length: {len(transcription)} characters")
                logger.info(f"🔍 Word count: {len(transcription.split()) if transcription else 0}")
                logger.info(f"👤 User: {user.name}")
                logger.info("=" * 80)
            
            onboarding_analysis = onboarding_analysis_service.analyze_onboarding_questions(
                user.onboarding_answers, user.name, transcription
            )
            
            # Send emails to both care person and emergency contact if available
            emails_to_send = []
            email_types = []
            
            if user.care_person_email:
                emails_to_send.append(user.care_person_email)
                email_types.append("care person")
            
            if user.emergency_contact_email:
                emails_to_send.append(user.emergency_contact_email)
                email_types.append("emergency contact")
            
            if emails_to_send:
                logger.info(f"Sending onboarding analysis alerts to: {', '.join(f'{t}: {e}' for t, e in zip(email_types, emails_to_send))}")
                email_service = EmailService()
                
                # Send emails to all available addresses
                emails_sent = 0
                total_emails = len(emails_to_send)
                
                for email, email_type in zip(emails_to_send, email_types):
                    try:
                        # Log the transcription being sent in this email
                        transcription_content = onboarding_analysis.get('transcription', '')
                        if transcription_content:
                            logger.info("=" * 80)
                            logger.info(f"📧 SENDING EMAIL WITH TRANSCRIPTION TO {email_type.upper()}")
                            logger.info("=" * 80)
                            logger.info(f"📧 Email: {email}")
                            logger.info(f"👤 User: {user.name}")
                            logger.info(f"🎯 Transcribed text: \"{transcription_content}\"")
                            logger.info(f"📊 Text length: {len(transcription_content)} characters")
                            logger.info("=" * 80)
                        
                        # For testing: always send email after analysis
                        email_sent = email_service.send_onboarding_analysis_alert(
                            to_email=email,
                            user_name=user.name,
                            onboarding_analysis=onboarding_analysis,
                            audio_analysis_failed=True,
                            recipient_type=email_type,
                            transcription=transcription_content  # Include transcription if available
                        )
                        
                        if email_sent:
                            logger.info(f"Onboarding analysis alert sent successfully to {email_type}: {email}")
                            emails_sent += 1
                        else:
                            logger.error(f"Failed to send onboarding analysis alert to {email_type}: {email}")
                            
                    except Exception as e:
                        logger.error(f"Error sending email to {email_type} {email}: {e}")
                
                logger.info(f"Email sending complete: {emails_sent}/{total_emails} emails sent successfully")
                return emails_sent > 0  # Return True if at least one email was sent
            else:
                logger.warning(f"No care person email or emergency contact email configured for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to handle audio analysis failure for audio {audio_id}: {e}")
            return False

    async def send_real_time_update(self, user_id: int, message_type: str, data: Dict[str, Any]):
        """Send real-time update via WebSocket if available"""
        try:
            from app.views.audio import manager
            await manager.send_personal_message({
                "type": message_type,
                "timestamp": datetime.now().isoformat(),
                **data
            }, user_id)
        except Exception as e:
            logger.warning(f"Failed to send real-time update: {e}")

    async def update_transcription_status(self, db: Session, audio_id: int, user_id: int, 
                                        status: str, transcription: str = None, confidence: float = None):
        """Update transcription status and send real-time update"""
        try:
            audio = self.get_audio(db, audio_id, user_id)
            if audio:
                audio.transcription_status = status
                if transcription:
                    audio.transcription = transcription
                if confidence:
                    audio.transcription_confidence = confidence
                if status == "completed":
                    audio.transcribed_at = datetime.now()
                
                db.commit()
                
                # Send real-time update
                await self.send_real_time_update(user_id, "transcription_update", {
                    "audio_id": audio_id,
                    "status": status,
                    "transcription": transcription,
                    "confidence": confidence
                })
                
                logger.info(f"Transcription status updated for audio {audio_id}: {status}")
        except Exception as e:
            logger.error(f"Failed to update transcription status: {e}")

    async def update_analysis_status(self, db: Session, audio_id: int, user_id: int, 
                                   status: str, risk_level: str = None, analysis_data: Dict[str, Any] = None):
        """Update analysis status and send real-time update"""
        try:
            audio = self.get_audio(db, audio_id, user_id)
            if audio:
                audio.analysis_status = status
                if risk_level:
                    audio.risk_level = risk_level
                if analysis_data:
                    audio.mental_health_indicators = analysis_data.get('mental_health_indicators')
                    audio.summary = analysis_data.get('summary')
                    audio.recommendations = analysis_data.get('recommendations')
                if status == "completed":
                    audio.analyzed_at = datetime.now()
                
                db.commit()
                
                # Send real-time update
                await self.send_real_time_update(user_id, "analysis_update", {
                    "audio_id": audio_id,
                    "status": status,
                    "risk_level": risk_level,
                    "analysis_data": analysis_data
                })
                
                logger.info(f"Analysis status updated for audio {audio_id}: {status}")
        except Exception as e:
            logger.error(f"Failed to update analysis status: {e}")

audio_controller = AudioController()
