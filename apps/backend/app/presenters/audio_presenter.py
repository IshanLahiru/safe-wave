"""
Audio Presenter - handles the presentation logic for audio-related operations.
This follows the MVP pattern where the presenter coordinates between the view and model.
"""

import logging
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.audio import Audio
from app.controllers.audio_controller import AudioController
from app.exceptions.base import (
    UserDataError, 
    EmailServiceError, 
    AnalysisServiceError,
    ConfigurationError
)
from app.services.onboarding_analysis_service import onboarding_analysis_service
from app.utils.email_service import EmailService

logger = logging.getLogger(__name__)


class AudioPresenter:
    """
    Presenter for audio-related operations.
    Handles the coordination between views and business logic.
    """
    
    def __init__(self):
        self.audio_controller = AudioController()
        self.email_service = EmailService()
    
    def handle_analysis_failure(
        self, 
        db: Session, 
        audio_id: int, 
        user_id: int, 
        user_data: Dict[str, Any], 
        failure_reason: str, 
        transcription: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Handle audio analysis failure with clear error reporting.
        
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            logger.info(f"🔄 Handling analysis failure for audio {audio_id}, user {user_id}")
            
            # Step 1: Get user and validate onboarding data
            user = self._get_user_with_validation(db, user_id)
            
            # Step 2: Perform onboarding analysis
            analysis_result = self._perform_onboarding_analysis(user, transcription)
            
            # Step 3: Send email notifications
            email_results = self._send_email_notifications(user, analysis_result, transcription)
            
            # Step 4: Return results
            if email_results["emails_sent"] > 0:
                message = f"✅ Sent {email_results['emails_sent']} notification(s) successfully"
                logger.info(message)
                return True, message
            else:
                message = f"⚠️ No emails could be sent: {email_results['reason']}"
                logger.warning(message)
                return False, message
                
        except UserDataError as e:
            message = f"❌ User data issue: {e.message}"
            logger.error(message)
            return False, message
            
        except AnalysisServiceError as e:
            message = f"❌ Analysis failed: {e.message}"
            logger.error(message)
            return False, message
            
        except EmailServiceError as e:
            message = f"❌ Email service failed: {e.message}"
            logger.error(message)
            return False, message
            
        except Exception as e:
            message = f"❌ Unexpected error: {str(e)}"
            logger.error(message, exc_info=True)
            return False, message
    
    def _get_user_with_validation(self, db: Session, user_id: int) -> User:
        """Get user and validate required data for onboarding analysis"""
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise UserDataError(
                f"User {user_id} not found in database",
                user_id=user_id
            )
        
        if not user.onboarding_answers:
            raise UserDataError(
                f"User {user.name} hasn't completed onboarding questionnaire yet",
                user_id=user_id,
                missing_field="onboarding_answers"
            )
        
        logger.info(f"✅ User {user.name} found with onboarding data")
        return user
    
    def _perform_onboarding_analysis(self, user: User, transcription: Optional[str]) -> Dict[str, Any]:
        """Perform onboarding analysis with proper error handling"""
        try:
            logger.info(f"🧠 Analyzing onboarding data for {user.name}")
            
            if transcription:
                logger.info(f"📝 Including transcription: \"{transcription[:100]}{'...' if len(transcription) > 100 else ''}\"")
            
            analysis_result = onboarding_analysis_service.analyze_onboarding_questions(
                user.onboarding_answers, 
                user.name, 
                transcription
            )
            
            risk_level = analysis_result.get('risk_level', 'unknown')
            logger.info(f"✅ Analysis complete - Risk level: {risk_level}")
            
            return analysis_result
            
        except Exception as e:
            raise AnalysisServiceError(
                f"Couldn't analyze onboarding data for {user.name}: {str(e)}",
                service_type="onboarding_analysis"
            )
    
    def _send_email_notifications(
        self, 
        user: User, 
        analysis_result: Dict[str, Any], 
        transcription: Optional[str]
    ) -> Dict[str, Any]:
        """Send email notifications to care person and emergency contact"""
        
        # Collect email addresses
        email_recipients = []
        if user.care_person_email:
            email_recipients.append(("care person", user.care_person_email))
        if user.emergency_contact_email:
            email_recipients.append(("emergency contact", user.emergency_contact_email))
        
        if not email_recipients:
            return {
                "emails_sent": 0,
                "total_emails": 0,
                "reason": f"{user.name} hasn't configured any care person or emergency contact emails"
            }
        
        # Send emails
        emails_sent = 0
        total_emails = len(email_recipients)
        
        logger.info(f"📧 Sending notifications to {total_emails} recipient(s)")
        
        for recipient_type, email_address in email_recipients:
            try:
                success = self.email_service.send_onboarding_analysis_alert(
                    to_email=email_address,
                    user_name=user.name,
                    onboarding_analysis=analysis_result,
                    audio_analysis_failed=True,
                    recipient_type=recipient_type,
                    transcription=transcription
                )
                
                if success:
                    logger.info(f"✅ Email sent to {recipient_type}: {email_address}")
                    emails_sent += 1
                else:
                    logger.error(f"❌ Failed to send email to {recipient_type}: {email_address}")
                    
            except Exception as e:
                logger.error(f"❌ Error sending email to {recipient_type} {email_address}: {e}")
        
        return {
            "emails_sent": emails_sent,
            "total_emails": total_emails,
            "reason": f"Sent {emails_sent}/{total_emails} emails successfully"
        }


# Global instance
audio_presenter = AudioPresenter()
