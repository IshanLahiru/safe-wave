import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass

from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.email_alert import EmailAlert
from app.models.user import User
from app.utils.email_service import EmailService

logger = logging.getLogger(__name__)


@dataclass
class EmailAlertConfig:
    """Configuration for email alert service."""
    max_retries: int = 3
    rate_limit_window_minutes: int = 60
    max_emails_per_window: int = 10
    max_emails_per_recipient_per_hour: int = 5
    enable_html_emails: bool = True
    default_urgency_level: str = "medium"


class EmailAlertService:
    """
    Enhanced service for managing email alerts with database tracking.

    Features:
    - Database tracking of all email alerts
    - Rate limiting to prevent spam
    - Email validation
    - Configurable retry mechanisms
    - HTML and plain text email support
    - Comprehensive error handling
    - Performance metrics tracking
    """

    def __init__(self, config: EmailAlertConfig = None):
        self.email_service = EmailService()
        self.config = config or EmailAlertConfig()
        self._metrics = {
            "total_alerts_sent": 0,
            "successful_alerts": 0,
            "failed_alerts": 0,
            "retries_attempted": 0
        }

    def _validate_email(self, email: str) -> bool:
        """Validate email address format."""
        if not email or not isinstance(email, str):
            return False

        # Basic email regex pattern
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email.strip()) is not None

    def _check_rate_limit(self, db: Session, recipient_email: str, user_id: int) -> Tuple[bool, str]:
        """Check if sending email would exceed rate limits."""
        now = datetime.utcnow()

        # Check per-recipient rate limit (emails per hour)
        hour_ago = now - timedelta(hours=1)
        recent_emails = db.query(EmailAlert).filter(
            and_(
                EmailAlert.recipient_email == recipient_email,
                EmailAlert.created_at >= hour_ago,
                EmailAlert.sent_successfully == True
            )
        ).count()

        if recent_emails >= self.config.max_emails_per_recipient_per_hour:
            return False, f"Rate limit exceeded: {recent_emails} emails sent to {recipient_email} in the last hour"

        # Check global rate limit (emails per window)
        window_ago = now - timedelta(minutes=self.config.rate_limit_window_minutes)
        window_emails = db.query(EmailAlert).filter(
            and_(
                EmailAlert.user_id == user_id,
                EmailAlert.created_at >= window_ago,
                EmailAlert.sent_successfully == True
            )
        ).count()

        if window_emails >= self.config.max_emails_per_window:
            return False, f"Rate limit exceeded: {window_emails} emails sent in the last {self.config.rate_limit_window_minutes} minutes"

        return True, "Rate limit check passed"

    def _send_alert(
        self,
        db: Session,
        user: User,
        alert_type: str,
        subject: str,
        body: str,
        recipients: List[Dict[str, str]],
        audio_id: Optional[int] = None,
        risk_level: Optional[str] = None,
        urgency_level: Optional[str] = None,
        analysis_data: Optional[Dict[str, Any]] = None,
        transcription: Optional[str] = None,
        transcription_confidence: Optional[int] = None
    ) -> List[EmailAlert]:
        """
        Generic method to send alerts with database tracking.

        This reduces code duplication across different alert types.
        """
        alerts_created = []

        if not recipients:
            logger.warning(f"No recipients found for user {user.id}")
            return alerts_created

        for recipient in recipients:
            try:
                # Validate email address
                if not self._validate_email(recipient["email"]):
                    logger.error(f"Invalid email address: {recipient['email']}")
                    continue

                # Check rate limits
                rate_limit_ok, rate_limit_msg = self._check_rate_limit(db, recipient["email"], user.id)
                if not rate_limit_ok:
                    logger.warning(f"Rate limit check failed for {recipient['email']}: {rate_limit_msg}")
                    # Create alert record but mark as failed due to rate limit
                    alert = EmailAlert(
                        user_id=user.id,
                        audio_id=audio_id,
                        alert_type=alert_type,
                        recipient_email=recipient["email"],
                        recipient_type=recipient["type"],
                        subject=subject,
                        body=body,
                        risk_level=risk_level,
                        urgency_level=urgency_level or self.config.default_urgency_level,
                        analysis_data=analysis_data,
                        transcription=transcription,
                        transcription_confidence=transcription_confidence,
                        sent_successfully=False,
                        error_message=rate_limit_msg,
                        max_retries=self.config.max_retries
                    )
                    db.add(alert)
                    alerts_created.append(alert)
                    continue

                # Create email alert record
                alert = EmailAlert(
                    user_id=user.id,
                    audio_id=audio_id,
                    alert_type=alert_type,
                    recipient_email=recipient["email"],
                    recipient_type=recipient["type"],
                    subject=subject,
                    body=body,
                    risk_level=risk_level,
                    urgency_level=urgency_level or self.config.default_urgency_level,
                    analysis_data=analysis_data,
                    transcription=transcription,
                    transcription_confidence=transcription_confidence,
                    max_retries=self.config.max_retries
                )

                db.add(alert)
                db.flush()  # Get the ID

                # Send email
                success = self.email_service.send_email(
                    to_email=recipient["email"],
                    subject=subject,
                    body=body
                )

                # Update alert status
                alert.sent_successfully = success
                alert.sent_at = datetime.utcnow() if success else None
                if not success:
                    alert.error_message = "Failed to send email via email service"

                # Update metrics
                self._metrics["total_alerts_sent"] += 1
                if success:
                    self._metrics["successful_alerts"] += 1
                else:
                    self._metrics["failed_alerts"] += 1

                alerts_created.append(alert)

                logger.info(f"{alert_type} alert {'sent' if success else 'failed'} to {recipient['type']}: {recipient['email']}")

            except Exception as e:
                logger.error(f"Error creating {alert_type} alert for {recipient['email']}: {e}")
                # Still add the failed alert to database for tracking
                try:
                    if 'alert' in locals():
                        alert.sent_successfully = False
                        alert.error_message = f"Exception during alert creation: {str(e)}"
                        alerts_created.append(alert)
                    else:
                        # Create a minimal alert record for tracking the failure
                        failed_alert = EmailAlert(
                            user_id=user.id,
                            audio_id=audio_id,
                            alert_type=alert_type,
                            recipient_email=recipient.get("email", "unknown"),
                            recipient_type=recipient.get("type", "unknown"),
                            subject=subject,
                            body=body,
                            sent_successfully=False,
                            error_message=f"Exception during alert creation: {str(e)}",
                            max_retries=self.config.max_retries
                        )
                        db.add(failed_alert)
                        alerts_created.append(failed_alert)

                    self._metrics["failed_alerts"] += 1

                except Exception as db_error:
                    logger.error(f"Failed to create failure record for {recipient.get('email', 'unknown')}: {db_error}")

        try:
            db.commit()
        except Exception as commit_error:
            logger.error(f"Failed to commit alert records: {commit_error}")
            db.rollback()

        return alerts_created
    
    def send_immediate_voice_alert(
        self,
        db: Session,
        user: User,
        audio_id: int,
        transcription: str,
        confidence: float,
        recipients: List[Dict[str, str]] = None
    ) -> List[EmailAlert]:
        """
        Send immediate voice alert when user uploads audio.

        Args:
            db: Database session
            user: User object
            audio_id: ID of the audio file
            transcription: Audio transcription text
            confidence: Transcription confidence score
            recipients: List of recipients with email and type

        Returns:
            List of EmailAlert objects created
        """
        # Determine recipients if not provided
        if not recipients:
            recipients = self._get_user_recipients(user)

        # Prepare alert data
        subject = f"🎤 VOICE ALERT - {user.name} has uploaded voice audio"
        analysis_data = {
            "audio_id": audio_id,
            "confidence": confidence,
            "transcription_length": len(transcription),
            "word_count": len(transcription.split()) if transcription else 0
        }

        # Create email body for each recipient
        alerts_created = []
        for recipient in recipients:
            body = self._create_voice_alert_body(user, audio_id, transcription, confidence, recipient["type"])

            recipient_alerts = self._send_alert(
                db=db,
                user=user,
                alert_type="immediate_voice",
                subject=subject,
                body=body,
                recipients=[recipient],
                audio_id=audio_id,
                urgency_level="high",
                analysis_data=analysis_data,
                transcription=transcription,
                transcription_confidence=int(confidence * 100)
            )
            alerts_created.extend(recipient_alerts)

        return alerts_created
    
    def send_onboarding_analysis_alert(
        self,
        db: Session,
        user: User,
        audio_id: Optional[int],
        onboarding_analysis: Dict[str, Any],
        transcription: Optional[str] = None,
        audio_analysis_failed: bool = True,
        recipients: List[Dict[str, str]] = None
    ) -> List[EmailAlert]:
        """
        Send onboarding analysis alert when audio analysis fails.

        Args:
            db: Database session
            user: User object
            audio_id: ID of the audio file (optional)
            onboarding_analysis: Analysis results from onboarding data
            transcription: Audio transcription (optional)
            audio_analysis_failed: Whether this was triggered by audio analysis failure
            recipients: List of recipients with email and type

        Returns:
            List of EmailAlert objects created
        """
        # Determine recipients if not provided
        if not recipients:
            recipients = self._get_user_recipients(user)

        # Extract risk and urgency levels
        risk_level = onboarding_analysis.get("risk_level", "unknown")
        urgency_level = onboarding_analysis.get("urgency_level", "medium")

        # Prepare subject
        subject = (
            f"⚠️ Audio Analysis Failed - Onboarding Assessment for {user.name}"
            if audio_analysis_failed
            else f"📊 Onboarding Assessment Update for {user.name}"
        )

        # Create email body for each recipient
        alerts_created = []
        for recipient in recipients:
            body = self._create_onboarding_alert_body(
                user, onboarding_analysis, recipient["type"], transcription, audio_analysis_failed
            )

            recipient_alerts = self._send_alert(
                db=db,
                user=user,
                alert_type="onboarding_analysis",
                subject=subject,
                body=body,
                recipients=[recipient],
                audio_id=audio_id,
                risk_level=risk_level,
                urgency_level=urgency_level,
                analysis_data=onboarding_analysis,
                transcription=transcription
            )
            alerts_created.extend(recipient_alerts)

        return alerts_created
    
    def send_critical_alert(
        self,
        db: Session,
        user: User,
        audio_id: Optional[int],
        risk_level: str,
        alert_message: str,
        analysis_data: Dict[str, Any] = None,
        recipients: List[Dict[str, str]] = None
    ) -> List[EmailAlert]:
        """
        Send critical mental health alert.

        Args:
            db: Database session
            user: User object
            audio_id: ID of the audio file (optional)
            risk_level: Risk level (critical, high, etc.)
            alert_message: Alert message content
            analysis_data: Additional analysis data
            recipients: List of recipients with email and type

        Returns:
            List of EmailAlert objects created
        """
        # Determine recipients if not provided
        if not recipients:
            recipients = self._get_user_recipients(user)

        # Prepare alert data
        subject = f"🚨 CRITICAL ALERT - {user.name} needs immediate attention"
        body = self._create_critical_alert_body(user, risk_level, alert_message)

        return self._send_alert(
            db=db,
            user=user,
            alert_type="critical_risk",
            subject=subject,
            body=body,
            recipients=recipients,
            audio_id=audio_id,
            risk_level=risk_level,
            urgency_level="immediate",
            analysis_data=analysis_data or {}
        )
    
    def get_user_alerts(
        self,
        db: Session,
        user_id: int,
        alert_type: Optional[str] = None,
        limit: int = 50
    ) -> List[EmailAlert]:
        """Get email alerts for a user."""
        query = db.query(EmailAlert).filter(EmailAlert.user_id == user_id)
        
        if alert_type:
            query = query.filter(EmailAlert.alert_type == alert_type)
        
        return query.order_by(EmailAlert.created_at.desc()).limit(limit).all()
    
    def retry_failed_alerts(self, db: Session, max_retries: int = None) -> int:
        """Retry failed email alerts with enhanced error handling."""
        if max_retries is None:
            max_retries = self.config.max_retries

        failed_alerts = db.query(EmailAlert).filter(
            EmailAlert.sent_successfully == False,
            EmailAlert.retry_count < max_retries
        ).all()

        retried_count = 0
        successful_retries = 0

        for alert in failed_alerts:
            try:
                # Check rate limits before retry
                rate_limit_ok, rate_limit_msg = self._check_rate_limit(db, alert.recipient_email, alert.user_id)
                if not rate_limit_ok:
                    logger.warning(f"Skipping retry for alert {alert.id} due to rate limit: {rate_limit_msg}")
                    alert.error_message = f"Retry skipped: {rate_limit_msg}"
                    continue

                # Validate email before retry
                if not self._validate_email(alert.recipient_email):
                    logger.error(f"Skipping retry for alert {alert.id} due to invalid email: {alert.recipient_email}")
                    alert.error_message = "Retry skipped: Invalid email address"
                    alert.retry_count = max_retries  # Mark as max retries to prevent further attempts
                    continue

                success = self.email_service.send_email(
                    to_email=alert.recipient_email,
                    subject=alert.subject,
                    body=alert.body
                )

                alert.retry_count += 1
                alert.sent_successfully = success

                if success:
                    alert.sent_at = datetime.utcnow()
                    alert.error_message = None
                    successful_retries += 1
                    self._metrics["successful_alerts"] += 1
                else:
                    alert.error_message = "Retry failed - email service returned failure"
                    self._metrics["failed_alerts"] += 1

                retried_count += 1
                self._metrics["retries_attempted"] += 1

                logger.info(f"Retry {'successful' if success else 'failed'} for alert {alert.id}")

            except Exception as e:
                alert.retry_count += 1
                alert.error_message = f"Retry exception: {str(e)}"
                logger.error(f"Retry failed for alert {alert.id}: {e}")
                self._metrics["retries_attempted"] += 1
                self._metrics["failed_alerts"] += 1

        try:
            db.commit()
            logger.info(f"Retry operation completed: {successful_retries}/{retried_count} successful")
        except Exception as commit_error:
            logger.error(f"Failed to commit retry results: {commit_error}")
            db.rollback()

        return retried_count

    def get_metrics(self) -> Dict[str, Any]:
        """Get email alert service metrics."""
        return {
            **self._metrics,
            "success_rate": (
                self._metrics["successful_alerts"] / max(self._metrics["total_alerts_sent"], 1) * 100
            ),
            "config": {
                "max_retries": self.config.max_retries,
                "rate_limit_window_minutes": self.config.rate_limit_window_minutes,
                "max_emails_per_window": self.config.max_emails_per_window,
                "max_emails_per_recipient_per_hour": self.config.max_emails_per_recipient_per_hour
            }
        }

    def reset_metrics(self):
        """Reset metrics counters."""
        self._metrics = {
            "total_alerts_sent": 0,
            "successful_alerts": 0,
            "failed_alerts": 0,
            "retries_attempted": 0
        }
        logger.info("Email alert service metrics reset")

    def get_alert_statistics(self, db: Session, user_id: Optional[int] = None, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive alert statistics from database."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        query = db.query(EmailAlert).filter(EmailAlert.created_at >= cutoff_date)
        if user_id:
            query = query.filter(EmailAlert.user_id == user_id)

        alerts = query.all()

        total_alerts = len(alerts)
        successful_alerts = len([a for a in alerts if a.sent_successfully])
        failed_alerts = total_alerts - successful_alerts

        # Group by alert type
        alert_types = {}
        for alert in alerts:
            alert_types[alert.alert_type] = alert_types.get(alert.alert_type, 0) + 1

        # Group by risk level
        risk_levels = {}
        for alert in alerts:
            if alert.risk_level:
                risk_levels[alert.risk_level] = risk_levels.get(alert.risk_level, 0) + 1

        return {
            "period_days": days,
            "total_alerts": total_alerts,
            "successful_alerts": successful_alerts,
            "failed_alerts": failed_alerts,
            "success_rate": (successful_alerts / max(total_alerts, 1)) * 100,
            "alert_types": alert_types,
            "risk_levels": risk_levels,
            "average_alerts_per_day": total_alerts / max(days, 1)
        }
    
    def _get_user_recipients(self, user: User) -> List[Dict[str, str]]:
        """Get list of recipients for a user."""
        recipients = []
        
        if user.care_person_email:
            recipients.append({
                "email": user.care_person_email,
                "type": "care_person"
            })
        
        if user.emergency_contact_email:
            recipients.append({
                "email": user.emergency_contact_email,
                "type": "emergency_contact"
            })
        
        return recipients
    
    def _create_voice_alert_body(self, user: User, audio_id: int, transcription: str, confidence: float, recipient_type: str) -> str:
        """Create enhanced email body for voice alert."""
        greeting = (
            f"🚨 Emergency Contact Alert for {user.name}"
            if recipient_type == "emergency_contact"
            else f"🎤 Voice Alert for {user.name}"
        )

        recipient_note = (
            "You are receiving this alert as an emergency contact for this user."
            if recipient_type == "emergency_contact"
            else "You are receiving this alert as a care person for this user."
        )

        # Determine confidence level description
        if confidence >= 0.9:
            confidence_desc = "Very High"
        elif confidence >= 0.7:
            confidence_desc = "High"
        elif confidence >= 0.5:
            confidence_desc = "Medium"
        else:
            confidence_desc = "Low"

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        return f"""
{greeting}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ALERT DETAILS:
   • User: {user.name}
   • Alert Type: Voice Audio Upload
   • Audio ID: {audio_id}
   • Timestamp: {timestamp}
   • Transcription Confidence: {confidence:.1%} ({confidence_desc})

📝 AUDIO TRANSCRIPTION:
   "{transcription}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT NOTICE:
{recipient_note}

This is an immediate alert that {user.name} has uploaded voice audio to the Safe Wave platform.
The audio has been transcribed and is being analyzed for mental health risk assessment.

🔍 RECOMMENDED ACTIONS:
   • Check in with {user.name} to ensure they are safe
   • Provide emotional support as needed
   • If you notice signs of distress, encourage professional help
   • In case of emergency, contact local emergency services immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Safe Wave Mental Health Support Team

This is an automated alert from the Safe Wave platform.
For technical support, please contact our support team.
        """
    
    def _create_onboarding_alert_body(self, user: User, analysis: Dict[str, Any], recipient_type: str, transcription: Optional[str], audio_failed: bool) -> str:
        """Create email body for onboarding analysis alert."""
        greeting = f"Emergency Contact Alert for {user.name}" if recipient_type == "emergency_contact" else f"Mental Health Assessment Alert for {user.name}"
        recipient_note = "You are receiving this alert as an emergency contact for this user." if recipient_type == "emergency_contact" else "You are receiving this alert as a care person for this user."
        
        transcription_section = f"""
        AUDIO TRANSCRIPTION:
        "{transcription}"
        """ if transcription else ""
        
        note_section = "NOTE: This assessment was triggered because the audio analysis failed. Please check in with the user directly." if audio_failed else ""
        
        return f"""
        {greeting}
        
        User: {user.name}
        Assessment Type: Onboarding Questionnaire Analysis
        Risk Level: {analysis.get('risk_level', 'unknown').upper()}
        Urgency Level: {analysis.get('urgency_level', 'unknown').upper()}
        
        {recipient_note}
        
        {transcription_section}
        
        Key Concerns:
        {chr(10).join(f"• {concern}" for concern in analysis.get('key_concerns', ['None identified']))}
        
        Summary:
        {analysis.get('summary', 'No summary available')}
        
        Recommendations:
        {chr(10).join(f"• {rec}" for rec in analysis.get('recommendations', ['No recommendations available']))}
        
        Care Person Alert:
        {analysis.get('care_person_alert', 'No specific alert message')}
        
        {note_section}
        
        Best regards,
        Safe Wave Team
        """
    
    def _create_critical_alert_body(self, user: User, risk_level: str, alert_message: str) -> str:
        """Create enhanced email body for critical alert."""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Determine urgency indicators based on risk level
        if risk_level.lower() == "critical":
            urgency_indicator = "🚨🚨🚨 CRITICAL EMERGENCY 🚨🚨🚨"
            action_required = "IMMEDIATE ACTION REQUIRED"
        elif risk_level.lower() == "high":
            urgency_indicator = "🚨🚨 HIGH RISK ALERT 🚨🚨"
            action_required = "URGENT ACTION REQUIRED"
        else:
            urgency_indicator = "🚨 MENTAL HEALTH ALERT 🚨"
            action_required = "PROMPT ACTION REQUIRED"

        return f"""
{urgency_indicator}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            MENTAL HEALTH CRISIS ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ALERT DETAILS:
   • User: {user.name}
   • Risk Level: {risk_level.upper()}
   • Alert Time: {timestamp}
   • Status: {action_required}

📝 ALERT MESSAGE:
{alert_message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMMEDIATE ACTIONS REQUIRED:

1. 📞 CONTACT {user.name} RIGHT AWAY
   • Call them immediately
   • Check on their safety and wellbeing
   • Provide emotional support

2. 🆘 IF LIFE-THREATENING EMERGENCY:
   • Call emergency services (911/999/112) IMMEDIATELY
   • Do not delay if there is immediate danger

3. 🏥 PROFESSIONAL HELP:
   • Encourage seeking immediate professional mental health support
   • Consider accompanying them to emergency services if needed
   • Contact their healthcare provider or therapist

4. 👥 SUPPORT NETWORK:
   • Notify other trusted family members or friends if appropriate
   • Ensure someone stays with them if possible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 EMERGENCY RESOURCES:
   • National Suicide Prevention Lifeline: 988 (US)
   • Crisis Text Line: Text HOME to 741741
   • International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

This alert was generated by the Safe Wave AI mental health monitoring system.
Time is critical - please act immediately.

Safe Wave Crisis Alert System
        """


# Global instance
email_alert_service = EmailAlertService()
