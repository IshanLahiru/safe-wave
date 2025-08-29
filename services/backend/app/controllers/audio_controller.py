import os
import openai
from sqlalchemy.orm import Session
from app.models.audio_analysis import AudioAnalysis
from app.models.user import User
from app.schemas.audio import AudioAnalysisCreate, AudioAnalysisUpdate, LLMAnalysisResult
from app.core.config import settings
from app.utils.email_service import EmailService
from typing import Optional, Dict, Any
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AudioController:
    
    def __init__(self):
        # Initialize OpenAI client for both Whisper and LLM
        if settings.OPENAI_API_KEY:
            try:
                # Try new OpenAI client format
                self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized with new format")
            except TypeError:
                # Fallback to old format
                try:
                    openai.api_key = settings.OPENAI_API_KEY
                    self.openai_client = openai
                    logger.info("OpenAI client initialized with legacy format")
                except Exception as e:
                    logger.error(f"Failed to initialize OpenAI client: {e}")
                    self.openai_client = None
        else:
            self.openai_client = None
            logger.warning("OpenAI API key not configured")
        
        # Initialize email service
        self.email_service = EmailService()
    
    def create_audio_analysis(self, db: Session, audio_data: AudioAnalysisCreate) -> AudioAnalysis:
        """Create a new audio analysis record"""
        db_audio = AudioAnalysis(**audio_data.dict())
        db.add(db_audio)
        db.commit()
        db.refresh(db_audio)
        return db_audio
    
    def transcribe_audio(self, audio_file_path: str) -> tuple[str, int]:
        """Transcribe audio using OpenAI Whisper API"""
        if not self.openai_client:
            raise Exception("OpenAI client not available")
        
        try:
            # Check if using new or legacy format
            if hasattr(self.openai_client, 'audio'):
                # New format
                with open(audio_file_path, "rb") as audio_file:
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="verbose_json"
                    )
                transcription = transcript.text
                confidence = int(transcript.words[0].confidence * 100) if transcript.words else 80
            else:
                # Legacy format
                with open(audio_file_path, "rb") as audio_file:
                    transcript = self.openai_client.Audio.transcribe(
                        "whisper-1",
                        audio_file
                    )
                transcription = transcript.text
                confidence = 80  # Default confidence for legacy format
            
            logger.info(f"Audio transcribed successfully. Confidence: {confidence}%")
            return transcription, confidence
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise Exception(f"Audio transcription failed: {str(e)}")
    
    def analyze_with_llm(self, transcription: str, user_data: Dict[str, Any]) -> LLMAnalysisResult:
        """Analyze transcription using OpenAI LLM"""
        if not self.openai_client:
            raise Exception("OpenAI client not available")
        
        try:
            # Prepare context for LLM analysis
            user_context = f"""
            User: {user_data.get('name', 'Unknown')}
            Age: {user_data.get('age', 'Unknown')}
            Previous mental health indicators: {user_data.get('mental_health_history', 'None')}
            Emergency contacts: {user_data.get('emergency_contact_name', 'None')}
            Care person: {user_data.get('care_person_email', 'None')}
            """
            
            # Create analysis prompt
            prompt = f"""
            You are a mental health AI assistant analyzing a user's audio message. 
            Please analyze the following transcription and provide a comprehensive assessment.
            
            User Context:
            {user_context}
            
            Audio Transcription:
            "{transcription}"
            
            Please provide analysis in the following JSON format:
            {{
                "risk_level": "low|medium|high|critical",
                "mental_health_indicators": {{
                    "mood": "description",
                    "anxiety_level": "description", 
                    "depression_signs": "description",
                    "suicidal_ideation": "boolean",
                    "self_harm_risk": "boolean",
                    "substance_abuse": "description",
                    "social_isolation": "description"
                }},
                "summary": "brief summary of the analysis",
                "recommendations": ["list", "of", "recommendations"],
                "requires_immediate_attention": boolean,
                "care_person_alert": boolean,
                "alert_message": "message to send to care person if alert is needed"
            }}
            
            Be thorough but compassionate. If you detect any signs of crisis, suicidal ideation, 
            or immediate danger, set risk_level to "critical" and care_person_alert to true.
            """
            
            # Get LLM response
            if hasattr(self.openai_client, 'chat'):
                # New format
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=1000
                )
                content = response.choices[0].message.content
            else:
                # Legacy format
                response = self.openai_client.ChatCompletion.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=1000
                )
                content = response.choices[0].message.content
            
            # Parse response
            analysis_data = json.loads(content)
            
            # Create structured result
            result = LLMAnalysisResult(**analysis_data)
            
            logger.info(f"LLM analysis completed. Risk level: {result.risk_level}")
            return result
            
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            raise Exception(f"LLM analysis failed: {str(e)}")
    
    def update_analysis_results(self, db: Session, analysis_id: int, 
                               transcription: str, confidence: int, 
                               llm_result: LLMAnalysisResult) -> AudioAnalysis:
        """Update audio analysis with results"""
        update_data = AudioAnalysisUpdate(
            transcription=transcription,
            transcription_confidence=confidence,
            llm_analysis=llm_result.dict(),
            risk_level=llm_result.risk_level,
            mental_health_indicators=llm_result.mental_health_indicators,
            analyzed_at=datetime.utcnow()
        )
        
        # Get the analysis record
        analysis = db.query(AudioAnalysis).filter(AudioAnalysis.id == analysis_id).first()
        if not analysis:
            raise Exception("Audio analysis not found")
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(analysis, field, value)
        
        db.commit()
        db.refresh(analysis)
        return analysis
    
    def send_care_person_alert(self, db: Session, analysis_id: int, 
                              user_data: Dict[str, Any], alert_message: str) -> bool:
        """Send alert email to care person"""
        try:
            care_person_email = user_data.get('care_person_email')
            if not care_person_email:
                logger.warning("No care person email found for user")
                return False
            
            # Prepare email content
            subject = f"Mental Health Alert - {user_data.get('name', 'User')}"
            body = f"""
            Dear Care Person,
            
            This is an automated alert from Safe Wave regarding {user_data.get('name', 'the user')}.
            
            {alert_message}
            
            Please check in with them as soon as possible.
            
            Best regards,
            Safe Wave Team
            """
            
            # Send email
            success = self.email_service.send_email(
                to_email=care_person_email,
                subject=subject,
                body=body
            )
            
            if success:
                # Update analysis record
                analysis = db.query(AudioAnalysis).filter(AudioAnalysis.id == analysis_id).first()
                if analysis:
                    analysis.alert_sent = True
                    analysis.alert_sent_at = datetime.utcnow()
                    analysis.care_person_notified = True
                    db.commit()
                
                logger.info(f"Care person alert sent to {care_person_email}")
                return True
            else:
                logger.error(f"Failed to send care person alert to {care_person_email}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending care person alert: {e}")
            return False
    
    def process_audio_analysis(self, db: Session, analysis_id: int, 
                              user_data: Dict[str, Any]) -> AudioAnalysis:
        """Complete audio analysis pipeline"""
        try:
            # Get analysis record
            analysis = db.query(AudioAnalysis).filter(AudioAnalysis.id == analysis_id).first()
            if not analysis:
                raise Exception("Audio analysis not found")
            
            # Step 1: Transcribe audio
            transcription, confidence = self.transcribe_audio(analysis.audio_file_path)
            
            # Step 2: Analyze with LLM
            llm_result = self.analyze_with_llm(transcription, user_data)
            
            # Step 3: Update analysis results
            updated_analysis = self.update_analysis_results(
                db, analysis_id, transcription, confidence, llm_result
            )
            
            # Step 4: Send alert if critical
            if llm_result.risk_level == "critical" and llm_result.care_person_alert:
                self.send_care_person_alert(db, analysis_id, user_data, llm_result.alert_message)
            
            return updated_analysis
            
        except Exception as e:
            logger.error(f"Audio analysis pipeline failed: {e}")
            raise e
