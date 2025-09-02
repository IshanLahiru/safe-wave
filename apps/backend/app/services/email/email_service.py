"""
Email Service - handles all email-related operations.
This service provides a clean interface for sending different types of emails.
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.config import settings
from app.exceptions.base import EmailServiceError, ConfigurationError

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service class for handling email operations.
    Provides methods for sending different types of notifications.
    """
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        
        # Validate configuration on initialization
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate email configuration"""
        required_settings = {
            "SMTP_SERVER": self.smtp_server,
            "SMTP_USERNAME": self.smtp_username,
            "SMTP_PASSWORD": self.smtp_password,
            "FROM_EMAIL": self.from_email
        }
        
        missing_settings = [
            name for name, value in required_settings.items() 
            if not value
        ]
        
        if missing_settings:
            raise ConfigurationError(
                f"Email service not configured properly. Missing: {', '.join(missing_settings)}. "
                "Please check your environment configuration.",
                missing_config=missing_settings[0]
            )
    
    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """
        Send a basic email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (plain text)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            logger.info(f"📧 Sending email to {to_email}: {subject}")
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Email authentication failed: Check your SMTP username and password. Error: {e}")
            return False
        except smtplib.SMTPConnectError as e:
            logger.error(f"❌ Couldn't connect to email server {self.smtp_server}:{self.smtp_port}. Error: {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ Email service error: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error sending email to {to_email}: {e}")
            return False
    
    def send_mental_health_alert(
        self, 
        to_email: str, 
        user_name: str, 
        analysis_result: Dict[str, Any],
        recipient_type: str = "care person"
    ) -> bool:
        """
        Send a mental health alert email.
        
        Args:
            to_email: Recipient email address
            user_name: Name of the user being monitored
            analysis_result: Mental health analysis results
            recipient_type: Type of recipient (care person, emergency contact)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            risk_level = analysis_result.get('risk_level', 'unknown')
            urgency = analysis_result.get('urgency_level', 'low')
            
            # Create subject based on risk level
            if risk_level in ['high', 'critical']:
                subject = f"🚨 URGENT: Mental Health Alert for {user_name}"
            elif risk_level == 'medium':
                subject = f"⚠️ Mental Health Alert for {user_name}"
            else:
                subject = f"📋 Mental Health Update for {user_name}"
            
            # Create email body
            body = self._create_alert_email_body(
                user_name, analysis_result, recipient_type
            )
            
            return self.send_email(to_email, subject, body)
            
        except Exception as e:
            logger.error(f"❌ Failed to send mental health alert: {e}")
            return False
    
    def send_onboarding_analysis_alert(
        self,
        to_email: str,
        user_name: str,
        onboarding_analysis: Dict[str, Any],
        audio_analysis_failed: bool = False,
        recipient_type: str = "care person",
        transcription: Optional[str] = None
    ) -> bool:
        """
        Send an onboarding analysis alert email.
        
        Args:
            to_email: Recipient email address
            user_name: Name of the user
            onboarding_analysis: Onboarding analysis results
            audio_analysis_failed: Whether this is due to audio analysis failure
            recipient_type: Type of recipient
            transcription: Audio transcription if available
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create subject
            if audio_analysis_failed:
                subject = f"📋 Backup Analysis Alert for {user_name}"
            else:
                subject = f"📋 Onboarding Analysis for {user_name}"
            
            # Create email body
            body = self._create_onboarding_alert_body(
                user_name, onboarding_analysis, audio_analysis_failed, 
                recipient_type, transcription
            )
            
            return self.send_email(to_email, subject, body)
            
        except Exception as e:
            logger.error(f"❌ Failed to send onboarding analysis alert: {e}")
            return False
    
    def _create_alert_email_body(
        self, 
        user_name: str, 
        analysis_result: Dict[str, Any],
        recipient_type: str
    ) -> str:
        """Create the body for a mental health alert email"""
        
        risk_level = analysis_result.get('risk_level', 'unknown')
        summary = analysis_result.get('summary', 'No summary available')
        recommendations = analysis_result.get('recommendations', [])
        key_concerns = analysis_result.get('key_concerns', [])
        
        body = f"""Dear {recipient_type.title()},

This is an automated alert from Safe Wave regarding {user_name}'s mental health check-in.

ANALYSIS SUMMARY:
Risk Level: {risk_level.upper()}
Summary: {summary}

"""
        
        if key_concerns:
            body += f"""KEY CONCERNS:
{chr(10).join(f"• {concern}" for concern in key_concerns)}

"""
        
        if recommendations:
            body += f"""RECOMMENDATIONS:
{chr(10).join(f"• {rec}" for rec in recommendations)}

"""
        
        # Add urgency-specific messaging
        if risk_level in ['high', 'critical']:
            body += """🚨 IMMEDIATE ACTION RECOMMENDED:
This analysis indicates elevated risk. Please consider reaching out to {user_name} 
as soon as possible to check on their wellbeing.

"""
        
        body += f"""This alert was generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}.

If you have concerns about {user_name}'s immediate safety, please contact emergency services 
or a mental health crisis line in your area.

Best regards,
Safe Wave Mental Health Monitoring System"""
        
        return body
    
    def _create_onboarding_alert_body(
        self,
        user_name: str,
        onboarding_analysis: Dict[str, Any],
        audio_analysis_failed: bool,
        recipient_type: str,
        transcription: Optional[str]
    ) -> str:
        """Create the body for an onboarding analysis alert email"""
        
        body = f"""Dear {recipient_type.title()},

This is an automated alert from Safe Wave regarding {user_name}.

"""
        
        if audio_analysis_failed:
            body += f"""CONTEXT:
{user_name} submitted an audio check-in, but our primary analysis system encountered 
an issue. As a backup, we've analyzed their onboarding questionnaire responses to 
provide you with relevant insights.

"""
            
            if transcription:
                body += f"""AUDIO TRANSCRIPTION:
"{transcription}"

"""
        
        # Add onboarding analysis details
        risk_level = onboarding_analysis.get('risk_level', 'unknown')
        summary = onboarding_analysis.get('summary', 'No summary available')
        recommendations = onboarding_analysis.get('recommendations', [])
        
        body += f"""ONBOARDING ANALYSIS:
Risk Level: {risk_level.upper()}
Summary: {summary}

"""
        
        if recommendations:
            body += f"""RECOMMENDATIONS:
{chr(10).join(f"• {rec}" for rec in recommendations)}

"""
        
        body += f"""This analysis was generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}.

If you have any concerns about {user_name}'s wellbeing, please consider reaching out to them.

Best regards,
Safe Wave Mental Health Monitoring System"""
        
        return body
    
    def test_email_configuration(self) -> Dict[str, Any]:
        """
        Test email configuration by attempting to connect to SMTP server.
        
        Returns:
            Dictionary with test results
        """
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
            
            return {
                "success": True,
                "message": "Email configuration is working correctly",
                "smtp_server": self.smtp_server,
                "smtp_port": self.smtp_port
            }
            
        except smtplib.SMTPAuthenticationError:
            return {
                "success": False,
                "message": "SMTP authentication failed - check username and password",
                "smtp_server": self.smtp_server,
                "smtp_port": self.smtp_port
            }
        except smtplib.SMTPConnectError:
            return {
                "success": False,
                "message": f"Cannot connect to SMTP server {self.smtp_server}:{self.smtp_port}",
                "smtp_server": self.smtp_server,
                "smtp_port": self.smtp_port
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Email configuration test failed: {str(e)}",
                "smtp_server": self.smtp_server,
                "smtp_port": self.smtp_port
            }


# Global instance
email_service = EmailService()
