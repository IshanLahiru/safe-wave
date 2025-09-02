import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL

    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email using configured SMTP settings"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg["From"] = self.from_email
            msg["To"] = to_email
            msg["Subject"] = subject

            # Add body
            msg.attach(MIMEText(body, "plain"))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def send_critical_alert(
        self, to_email: str, user_name: str, risk_level: str, alert_message: str
    ) -> bool:
        """Send critical mental health alert"""
        subject = f"🚨 CRITICAL ALERT - {user_name} needs immediate attention"
        body = f"""
        URGENT: Mental Health Crisis Alert
        
        User: {user_name}
        Risk Level: {risk_level.upper()}
        
        {alert_message}
        
        This requires IMMEDIATE attention. Please contact {user_name} right away.
        
        If this is a life-threatening emergency, call emergency services immediately.
        
        Best regards,
        Safe Wave Crisis Alert System
        """

        return self.send_email(to_email, subject, body)

    def send_immediate_voice_alert(
        self,
        to_email: str,
        user_name: str,
        transcription: str,
        confidence: float,
        audio_id: int,
        recipient_type: str = "care person",
    ) -> bool:
        """Send immediate voice alert when user uploads audio"""
        # Customize subject and greeting based on recipient type
        if recipient_type == "emergency contact":
            subject = f"🚨 IMMEDIATE VOICE ALERT - {user_name} has uploaded voice audio"
            greeting = f"Emergency Contact Alert for {user_name}"
            recipient_note = "You are receiving this alert as an emergency contact for this user."
        else:
            subject = f"🎤 VOICE ALERT - {user_name} has uploaded voice audio"
            greeting = f"Voice Alert for {user_name}"
            recipient_note = "You are receiving this alert as a care person for this user."

        # Log the transcription content being sent in email
        logger.info("=" * 80)
        logger.info("IMMEDIATE VOICE ALERT EMAIL")
        logger.info("=" * 80)
        logger.info(f"User: {user_name}")
        logger.info(f"Recipient: {to_email}")
        logger.info(f"Recipient type: {recipient_type}")
        logger.info(f'Transcribed text: "{transcription}"')
        logger.info(f"Text length: {len(transcription)} characters")
        logger.info(f"Word count: {len(transcription.split()) if transcription else 0}")
        logger.info(f"Confidence: {confidence:.4f}")
        logger.info("=" * 80)

        body = f"""
        {greeting}
        
        User: {user_name}
        Alert Type: Voice Audio Upload
        Audio ID: {audio_id}
        Confidence: {confidence:.2%}
        
        {recipient_note}
        
        AUDIO TRANSCRIPTION:
        "{transcription}"
        
        This is an immediate alert that {user_name} has uploaded voice audio.
        The audio has been transcribed and is being analyzed for mental health risk assessment.
        
        Please check in with {user_name} to ensure they are safe and provide support as needed.
        
        Best regards,
        Safe Wave Team
        """

        return self.send_email(to_email, subject, body)

    def send_onboarding_analysis_alert(
        self,
        to_email: str,
        user_name: str,
        onboarding_analysis: dict,
        audio_analysis_failed: bool = True,
        recipient_type: str = "care person",
        transcription: str = None,
    ) -> bool:
        """Send onboarding analysis alert when audio analysis fails"""
        risk_level = onboarding_analysis.get("risk_level", "unknown")
        urgency = onboarding_analysis.get("urgency_level", "unknown")

        # Customize subject based on recipient type
        if audio_analysis_failed:
            subject = f"⚠️ Audio Analysis Failed - Onboarding Assessment for {user_name}"
        else:
            subject = f"📊 Onboarding Assessment Update for {user_name}"

        # Customize greeting based on recipient type
        if recipient_type == "emergency contact":
            greeting = f"Emergency Contact Alert for {user_name}"
            recipient_note = "You are receiving this alert as an emergency contact for this user."
        else:
            greeting = f"Mental Health Assessment Alert for {user_name}"
            recipient_note = "You are receiving this alert as a care person for this user."

        # Log the transcription content being sent in email
        if transcription:
            logger.info("=" * 80)
            logger.info("EMAIL INCLUDING AUDIO TRANSCRIPTION")
            logger.info("=" * 80)
            logger.info(f"User: {user_name}")
            logger.info(f"Recipient: {to_email}")
            logger.info(f"Recipient type: {recipient_type}")
            logger.info(f'Transcribed text: "{transcription}"')
            logger.info(f"Text length: {len(transcription)} characters")
            logger.info(f"Word count: {len(transcription.split()) if transcription else 0}")
            logger.info("=" * 80)

        body = f"""
        {greeting}
        
        User: {user_name}
        Assessment Type: Onboarding Questionnaire Analysis
        Risk Level: {risk_level.upper()}
        Urgency Level: {urgency.upper()}
        
        {recipient_note}
        
        {'AUDIO TRANSCRIPTION:' if transcription else ''}
        {f'"{transcription}"' if transcription else ''}
        
        Key Concerns:
        {chr(10).join(f"• {concern}" for concern in onboarding_analysis.get('key_concerns', ['None identified']))}
        
        Mental Health Indicators:
        • Mood: {onboarding_analysis.get('mental_health_indicators', {}).get('mood', 'Not assessed')}
        • Anxiety: {onboarding_analysis.get('mental_health_indicators', {}).get('anxiety', 'Not assessed')}
        • Depression: {onboarding_analysis.get('mental_health_indicators', {}).get('depression', 'Not assessed')}
        • Support System: {onboarding_analysis.get('mental_health_indicators', {}).get('support_system', 'Not assessed')}
        • Crisis Readiness: {onboarding_analysis.get('mental_health_indicators', {}).get('crisis_readiness', 'Not assessed')}
        
        Summary:
        {onboarding_analysis.get('summary', 'No summary available')}
        
        Recommendations:
        {chr(10).join(f"• {rec}" for rec in onboarding_analysis.get('recommendations', ['None provided']))}
        
        Care Person Alert:
        {onboarding_analysis.get('care_person_alert', 'No specific alert message')}
        
        {'NOTE: This assessment was triggered because the audio analysis failed. Please check in with the user directly.' if audio_analysis_failed else ''}
        
        Best regards,
        Safe Wave Team
        """

        return self.send_email(to_email, subject, body)

    def send_daily_summary(self, to_email: str, user_name: str, daily_insights: dict) -> bool:
        """Send daily mental health summary to care person"""
        subject = f"Daily Mental Health Summary - {user_name}"
        body = f"""
        Daily Mental Health Summary
        
        User: {user_name}
        Date: {daily_insights.get('date', 'Today')}
        
        Mood Trend: {daily_insights.get('mood_trend', 'Not available')}
        Stress Level: {daily_insights.get('stress_level', 'Not available')}
        Key Insights: {daily_insights.get('key_insights', 'None')}
        
        Recommendations: {daily_insights.get('recommendations', 'None')}
        
        Best regards,
        Safe Wave Team
        """

        return self.send_email(to_email, subject, body)
