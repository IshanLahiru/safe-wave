import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

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
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_critical_alert(self, to_email: str, user_name: str, risk_level: str, 
                           alert_message: str) -> bool:
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
    
    def send_daily_summary(self, to_email: str, user_name: str, 
                           daily_insights: dict) -> bool:
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
