import logging
import json
import requests
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenRouterService:
    """Service for LLM analysis using OpenRouter API"""
    
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL
        self.max_tokens = settings.OPENROUTER_MAX_TOKENS
        self.temperature = settings.OPENROUTER_TEMPERATURE
        
        if not self.api_key:
            logger.warning("⚠️ OpenRouter API key not configured")
        else:
            logger.info(f"✅ OpenRouter service initialized with model: {self.model}")
    
    def is_available(self) -> bool:
        """Check if OpenRouter service is available"""
        return bool(self.api_key)
    
    def analyze_mental_health(self, transcription: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze transcribed audio for mental health risk assessment
        
        Args:
            transcription: Transcribed audio text
            user_data: User information and context
            
        Returns:
            Dict containing mental health analysis
        """
        if not self.is_available():
            raise Exception("OpenRouter service not available - API key not configured")
        
        try:
            logger.info("=" * 80)
            logger.info("🧠 OPENROUTER MENTAL HEALTH ANALYSIS")
            logger.info("=" * 80)
            logger.info(f"📝 Transcription length: {len(transcription)} characters")
            logger.info(f"👤 User: {user_data.get('name', 'Unknown')}")
            logger.info(f"🤖 Model: {self.model}")
            
            # Create the analysis prompt
            prompt = self._create_mental_health_prompt(transcription, user_data)
            logger.info(f"📋 Prompt created: {len(prompt)} characters")
            
            # Call OpenRouter API
            logger.info("🔄 Calling OpenRouter API...")
            response = self._call_openrouter_api(prompt)
            
            # Parse the response
            logger.info("🔄 Parsing OpenRouter response...")
            analysis_data = self._parse_analysis_response(response)
            
            logger.info("=" * 80)
            logger.info("✅ OPENROUTER ANALYSIS COMPLETED")
            logger.info("=" * 80)
            logger.info(f"📊 Risk level: {analysis_data.get('risk_level', 'unknown')}")
            logger.info(f"⚠️ Urgency: {analysis_data.get('urgency_level', 'unknown')}")
            logger.info(f"📝 Summary: {analysis_data.get('summary', '')[:100]}...")
            logger.info("=" * 80)
            
            return analysis_data
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error("❌ OPENROUTER ANALYSIS FAILED")
            logger.error("=" * 80)
            logger.error(f"🚫 Error: {e}")
            logger.error(f"🔍 Exception type: {type(e)}")
            logger.error("=" * 80)
            raise Exception(f"OpenRouter analysis failed: {str(e)}")
    
    def _create_mental_health_prompt(self, transcription: str, user_data: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for mental health analysis"""
        
        user_name = user_data.get('name', 'Unknown')
        care_person = user_data.get('carePersonEmail', 'None')
        emergency_contact = user_data.get('emergencyContact', {}).get('email', 'None')
        
        prompt = f"""You are a mental health professional analyzing audio transcriptions for risk assessment.

USER CONTEXT:
- Name: {user_name}
- Care Person Email: {care_person}
- Emergency Contact: {emergency_contact}

AUDIO TRANSCRIPTION:
"{transcription}"

TASK: Analyze this audio transcription for mental health risk assessment and provide a detailed analysis in JSON format.

REQUIRED OUTPUT FORMAT (JSON):
{{
    "risk_level": "low|medium|high|critical",
    "urgency_level": "low|medium|high|critical",
    "mental_health_indicators": {{
        "mood": "description of emotional state",
        "anxiety": "level and description of anxiety",
        "depression": "level and description of depressive symptoms",
        "suicidal_ideation": false,
        "self_harm_risk": false,
        "substance_use": "any indications of substance use",
        "sleep_patterns": "sleep quality and patterns",
        "social_isolation": "level of social engagement"
    }},
    "key_concerns": [
        "list of specific concerns identified",
        "each concern should be actionable"
    ],
    "summary": "2-3 sentence comprehensive summary of mental health status",
    "recommendations": [
        "specific, actionable recommendations",
        "prioritized by urgency"
    ],
    "care_person_alert": "specific message for care person or emergency contact",
    "crisis_intervention_needed": false,
    "immediate_actions": [
        "list of immediate actions if crisis detected"
    ]
}}

ANALYSIS GUIDELINES:
1. Focus on identifying immediate risks and warning signs
2. Consider the context and tone of the transcription
3. Be specific about risk levels and urgency
4. Provide actionable recommendations
5. If crisis is detected, prioritize safety and immediate intervention

Please provide only the JSON response, no additional text."""
        
        return prompt
    
    def _call_openrouter_api(self, prompt: str) -> str:
        """Make API call to OpenRouter"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://safewave.app",
            "X-Title": "Safe Wave Mental Health Analysis"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a mental health professional. Provide analysis in JSON format only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": False
        }
        
        logger.info(f"📡 API Request to: {self.base_url}")
        logger.info(f"📊 Payload size: {len(json.dumps(payload))} characters")
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            logger.info(f"✅ API Response received: {response.status_code}")
            logger.info(f"📝 Response content: {response_data}")
            
            # Extract the content from the response
            if 'choices' in response_data and len(response_data['choices']) > 0:
                content = response_data['choices'][0]['message']['content']
                logger.info(f"📋 Extracted content: {len(content)} characters")
                return content
            else:
                raise Exception("Invalid response format from OpenRouter API")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ API request failed: {e}")
            raise Exception(f"OpenRouter API request failed: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Unexpected error in API call: {e}")
            raise Exception(f"OpenRouter API error: {str(e)}")
    
    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the JSON response from OpenRouter"""
        
        try:
            # Clean the response text (remove markdown if present)
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            logger.info(f"🧹 Cleaned response text: {cleaned_text[:200]}...")
            
            # Parse JSON
            analysis_data = json.loads(cleaned_text)
            
            # Validate required fields
            required_fields = ['risk_level', 'urgency_level', 'mental_health_indicators', 'summary', 'recommendations']
            for field in required_fields:
                if field not in analysis_data:
                    logger.warning(f"⚠️ Missing required field: {field}")
                    analysis_data[field] = "Not provided" if field != 'recommendations' else []
            
            logger.info(f"✅ Successfully parsed analysis response")
            return analysis_data
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed: {e}")
            logger.error(f"📝 Raw response: {response_text}")
            raise Exception(f"Failed to parse OpenRouter response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Response parsing failed: {e}")
            raise Exception(f"Failed to parse analysis response: {str(e)}")
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get information about the OpenRouter service"""
        return {
            "service": "OpenRouter",
            "available": self.is_available(),
            "model": self.model,
            "base_url": self.base_url,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "api_key_configured": bool(self.api_key)
        }

# Create global instance
openrouter_service = OpenRouterService()
