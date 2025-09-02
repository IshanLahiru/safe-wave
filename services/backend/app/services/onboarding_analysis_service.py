import logging
from typing import Any, Dict, Optional

import openai

from app.core.config import settings
from app.services.openrouter_service import openrouter_service

logger = logging.getLogger(__name__)


class OnboardingAnalysisService:
    def __init__(self):
        self.openai_client = None
        self._initialize_openai()

    def _initialize_openai(self):
        if settings.OPENAI_API_KEY:
            try:
                logger.info(
                    f"Initializing OpenAI client for onboarding analysis with API key: {settings.OPENAI_API_KEY[:20]}..."
                )

                # For OpenAI version 1.3.0, just set the API key
                openai.api_key = settings.OPENAI_API_KEY
                self.openai_client = openai
                logger.info("OpenAI client initialized successfully for onboarding analysis")

            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client for onboarding analysis: {e}")
                self.openai_client = None
        else:
            logger.warning("OpenAI API key not configured for onboarding analysis")
            self.openai_client = None

    def analyze_onboarding_questions(
        self, onboarding_answers: Dict[str, Any], user_name: str, transcription: str = None
    ) -> Dict[str, Any]:
        """Analyze onboarding questions and transcription to assess mental health risk when audio analysis fails"""

        try:
            # Try OpenRouter first
            if openrouter_service.is_available():
                logger.info("Using OpenRouter for onboarding analysis")
                return self._analyze_with_openrouter(onboarding_answers, user_name, transcription)

            # Fallback to OpenAI if available
            elif self.openai_client:
                logger.info("OpenRouter not available, using OpenAI for onboarding analysis")
                return self._analyze_with_openai(onboarding_answers, user_name, transcription)

            # Fallback to mock analysis
            else:
                logger.warning(
                    "Neither OpenRouter nor OpenAI available, using mock analysis for testing"
                )
                return self._create_mock_analysis(onboarding_answers, user_name, transcription)

        except Exception as e:
            logger.error(f"Analysis failed, using mock analysis: {e}")
            return self._create_mock_analysis(onboarding_answers, user_name, transcription)

    def _analyze_with_openrouter(
        self, onboarding_answers: Dict[str, Any], user_name: str, transcription: str = None
    ) -> Dict[str, Any]:
        """Analyze using OpenRouter API"""

        # Log the transcription content being analyzed
        if transcription:
            logger.info("=" * 80)
            logger.info("ANALYZING AUDIO TRANSCRIPTION WITH ONBOARDING DATA")
            logger.info("=" * 80)
            logger.info(f'Transcribed text: "{transcription}"')
            logger.info(f"Text length: {len(transcription)} characters")
            logger.info(f"Word count: {len(transcription.split()) if transcription else 0}")
            logger.info(f"User: {user_name}")
            logger.info("=" * 80)

        # Create a comprehensive prompt including transcription if available
        prompt = f"""Analyze these onboarding questionnaire answers and audio transcription for mental health risk assessment.

User: {user_name}

Onboarding Answers:
{self._format_onboarding_answers(onboarding_answers)}

{'Audio Transcription:' if transcription else ''}
{transcription if transcription else 'No audio transcription available'}

Based on both the onboarding answers and transcription (if available), provide a comprehensive mental health risk assessment in JSON format:
{{
    "risk_level": "low|medium|high|critical",
    "urgency_level": "low|medium|high|critical",
    "mental_health_indicators": {{
        "mood": "assessment based on answers and transcription",
        "anxiety": "assessment based on answers and transcription", 
        "depression": "assessment based on answers and transcription",
        "suicidal_ideation": false,
        "self_harm_risk": false,
        "support_system": "assessment of support network",
        "crisis_readiness": "assessment of crisis planning"
    }},
    "key_concerns": ["list of main concerns identified"],
    "summary": "2-3 sentence summary of mental health status",
    "recommendations": ["specific", "actionable", "recommendations"],
    "care_person_alert": "detailed message for care person",
    "transcription": "{transcription if transcription else 'None'}"
}}"""

        # Use OpenRouter service
        analysis_data = openrouter_service.analyze_mental_health(prompt, {"name": user_name})

        # Ensure transcription is included
        if transcription:
            analysis_data["transcription"] = transcription

        logger.info(
            f"OpenRouter onboarding analysis completed for user {user_name}: {analysis_data.get('risk_level', 'unknown')} risk"
        )
        return analysis_data

    def _analyze_with_openai(
        self, onboarding_answers: Dict[str, Any], user_name: str, transcription: str = None
    ) -> Dict[str, Any]:
        """Analyze using OpenAI API (fallback)"""

        # Create a comprehensive prompt for analyzing onboarding answers
        prompt = f"""Analyze these onboarding questionnaire answers for mental health risk assessment.

User: {user_name}

Onboarding Answers:
{self._format_onboarding_answers(onboarding_answers)}

Based on these answers, provide a comprehensive mental health risk assessment in JSON format:
{{
    "risk_level": "low|medium|high|critical",
    "mental_health_indicators": {{
        "mood": "assessment based on answers",
        "anxiety": "assessment based on answers", 
        "depression": "assessment based on answers",
        "suicidal_ideation": false,
        "self_harm_risk": false,
        "support_system": "assessment of support network",
        "crisis_readiness": "assessment of crisis planning"
    }},
    "key_concerns": ["list of main concerns identified"],
    "summary": "2-3 sentence summary of mental health status",
    "recommendations": ["specific", "actionable", "recommendations"],
    "urgency_level": "low|medium|high|critical",
    "care_person_alert": "detailed message for care person"
}}"""

        # Use OpenAI API with version 1.3.0+ format
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=800,
        )

        content = response.choices[0].message.content
        import json

        analysis_data = json.loads(content)

        # Ensure transcription is included
        if transcription:
            analysis_data["transcription"] = transcription

        logger.info(
            f"OpenAI onboarding analysis completed for user {user_name}: {analysis_data.get('risk_level', 'unknown')} risk"
        )
        return analysis_data

    def _create_mock_analysis(
        self, onboarding_answers: Dict[str, Any], user_name: str, transcription: str = None
    ) -> Dict[str, Any]:
        """Create a mock analysis for testing when OpenAI is not available"""
        logger.info(f"Creating mock analysis for user {user_name}")

        # Analyze the answers to determine risk level
        risk_level = "low"
        urgency_level = "low"

        # Check for concerning indicators
        if onboarding_answers.get("safety_concerns") in ["Some concerns", "Significant concerns"]:
            risk_level = "medium"
            urgency_level = "medium"

        if onboarding_answers.get("support_system") in ["Limited", "I need help building one"]:
            risk_level = "medium"
            urgency_level = "medium"

        if onboarding_answers.get("crisis_plan") in [
            "No, I need help creating one",
            "What is a crisis plan?",
        ]:
            risk_level = "high"
            urgency_level = "high"

        stress_level = onboarding_answers.get("stress_level", 5)
        sleep_quality = onboarding_answers.get("sleep_quality", 5)

        if stress_level >= 7 or sleep_quality <= 4:
            risk_level = "medium"
            urgency_level = "medium"

        # Create mock analysis
        mock_analysis = {
            "risk_level": risk_level,
            "mental_health_indicators": {
                "mood": "Based on stress level and sleep quality",
                "anxiety": "Assessed from daily struggles and coping mechanisms",
                "depression": "Evaluated from overall responses and support system",
                "suicidal_ideation": False,
                "self_harm_risk": False,
                "support_system": onboarding_answers.get("support_system", "Not specified"),
                "crisis_readiness": "Based on crisis plan availability",
            },
            "key_concerns": [
                f"Stress level: {stress_level}/10",
                f"Sleep quality: {sleep_quality}/10",
                f"Support system: {onboarding_answers.get('support_system', 'Not specified')}",
                f"Crisis planning: {onboarding_answers.get('crisis_plan', 'Not specified')}",
            ],
            "summary": f"User {user_name} shows {risk_level} risk level based on onboarding responses. Key concerns include stress management, sleep quality, and support system development.",
            "recommendations": [
                "Consider daily check-ins to monitor stress levels",
                "Develop healthy sleep hygiene practices",
                "Build stronger support network connections",
                "Create a crisis safety plan",
                "Practice stress-reduction techniques",
            ],
            "urgency_level": urgency_level,
            "care_person_alert": f"User {user_name} has completed onboarding with {risk_level} risk indicators. Please maintain regular check-ins and provide support as needed.",
        }

        # Include transcription if available
        if transcription:
            mock_analysis["transcription"] = transcription
            mock_analysis[
                "summary"
            ] += f" Audio transcription analysis: '{transcription[:100]}{'...' if len(transcription) > 100 else ''}'"

            # Log the transcription being used in mock analysis
            logger.info("=" * 80)
            logger.info("📝 MOCK ANALYSIS INCLUDING TRANSCRIPTION")
            logger.info("=" * 80)
            logger.info(f'🎯 Transcribed text: "{transcription}"')
            logger.info(f"📊 Text length: {len(transcription)} characters")
            logger.info(f"🔍 Word count: {len(transcription.split()) if transcription else 0}")
            logger.info("=" * 80)

        return mock_analysis

    def _format_onboarding_answers(self, answers: Dict[str, Any]) -> str:
        """Format onboarding answers for the AI prompt"""
        formatted = []

        # Map question IDs to readable labels
        question_labels = {
            "safety_concerns": "Safety Concerns",
            "support_system": "Support System",
            "crisis_plan": "Crisis Plan",
            "daily_struggles": "Daily Struggles",
            "coping_mechanisms": "Coping Mechanisms",
            "stress_level": "Stress Level",
            "sleep_quality": "Sleep Quality",
            "app_goals": "App Goals",
            "checkin_frequency": "Check-in Frequency",
            "emergency_contact_name": "Emergency Contact Name",
            "emergency_contact_email": "Emergency Contact Email",
            "emergency_contact_relationship": "Emergency Contact Relationship",
        }

        for key, value in answers.items():
            if value is not None and value != "":
                label = question_labels.get(key, key.replace("_", " ").title())
                formatted.append(f"{label}: {value}")

        return "\n".join(formatted)


# Create global instance
onboarding_analysis_service = OnboardingAnalysisService()
