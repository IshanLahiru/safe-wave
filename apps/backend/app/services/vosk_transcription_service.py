import os
import logging
import wave
import json
from typing import Tuple, Optional
from vosk import Model, KaldiRecognizer
import soundfile as sf
import numpy as np
import ffmpeg

logger = logging.getLogger(__name__)

class VoskTranscriptionService:
    """Service for audio transcription using Vosk offline speech recognition"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path or self._get_default_model_path()
        self._initialize_model()
    
    def _get_default_model_path(self) -> str:
        """Get the default Vosk model path"""
        # Check for common Vosk model locations
        possible_paths = [
            "models/vosk-model-small-en-us-0.15",
            "models/vosk-model-en-us-0.22",
            "models/vosk-model-small-en-us-0.15",
            os.path.expanduser("~/vosk-models/vosk-model-small-en-us-0.15"),
            os.path.expanduser("~/vosk-models/vosk-model-en-us-0.22"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        # Return a path that will trigger model download
        return "models/vosk-model-small-en-us-0.15"
    
    def _initialize_model(self):
        """Initialize the Vosk model"""
        try:
            if not os.path.exists(self.model_path):
                logger.warning(f"Vosk model not found at {self.model_path}")
                logger.info("Please download a Vosk model from https://alphacephei.com/vosk/models")
                logger.info("Recommended models:")
                logger.info("  - vosk-model-small-en-us-0.15 (small, fast)")
                logger.info("  - vosk-model-en-us-0.22 (medium, accurate)")
                self.model = None
                return
            
            logger.info(f"Loading Vosk model from {self.model_path}")
            self.model = Model(self.model_path)
            logger.info("✅ Vosk model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Vosk model: {e}")
            self.model = None
    
    def transcribe_audio(self, audio_file_path: str) -> Tuple[str, float, float]:
        """
        Transcribe audio file using Vosk
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Tuple of (transcription_text, confidence_score, duration_seconds)
        """
        if not self.model:
            raise Exception("Vosk model not loaded. Please download a model first.")
        
        try:
            logger.info(f"Starting Vosk transcription of file: {audio_file_path}")
            
            # Convert audio to WAV format if needed
            wav_path = self._convert_to_wav(audio_file_path)
            
            # Open the WAV file
            with wave.open(wav_path, 'rb') as wav_file:
                # Create recognizer
                recognizer = KaldiRecognizer(self.model, wav_file.getframerate())
                recognizer.SetWords(True)  # Enable word-level timestamps
                
                # Read audio data
                audio_data = wav_file.readframes(wav_file.getnframes())
                
                # Process audio
                logger.info(f"🔄 Processing audio data: {len(audio_data)} bytes")
                logger.info(f"🎵 Sample rate: {wav_file.getframerate()} Hz")
                logger.info(f"🎧 Channels: {wav_file.getnchannels()}")
                logger.info(f"📊 Frame count: {wav_file.getnframes()}")
                duration = wav_file.getnframes() / wav_file.getframerate()
                logger.info(f"⏱️ Duration: {duration:.2f} seconds")
                
                # Process the audio data
                logger.info("🔄 Running Vosk recognition...")
                if recognizer.AcceptWaveform(audio_data):
                    result = json.loads(recognizer.Result())
                    logger.info("✅ Vosk returned final result")
                    logger.info(f"📝 Final result: {result}")
                else:
                    # Get partial result
                    result = json.loads(recognizer.PartialResult())
                    logger.info("⚠️ Vosk returned partial result")
                    logger.info(f"📝 Partial result: {result}")
                
                # If we only got a partial result, try to get the final result
                if 'partial' in result and not result.get('text'):
                    logger.info("🔄 Attempting to force final result...")
                    # Force final result
                    final_result = json.loads(recognizer.FinalResult())
                    logger.info(f"📝 Final result after forcing: {final_result}")
                    if final_result.get('text'):
                        result = final_result
                        logger.info("✅ Successfully obtained final result")
                    else:
                        logger.warning("⚠️ Still no final text after forcing")
                
                # Extract transcription and confidence
                transcription = result.get('text', '').strip()
                if not transcription and result.get('partial'):
                    # Use partial result if no final text
                    transcription = result.get('partial', '').strip()
                    logger.info("📝 Using partial result as transcription")
                
                confidence = self._calculate_confidence(result)
                
                logger.info("=" * 80)
                logger.info("🎯 VOSK TRANSCRIPTION COMPLETED")
                logger.info("=" * 80)
                logger.info(f"📝 Final transcription: \"{transcription}\"")
                logger.info(f"📊 Transcription length: {len(transcription)} characters")
                logger.info(f"🔍 Word count: {len(transcription.split()) if transcription else 0}")
                logger.info(f"🎯 Confidence score: {confidence:.4f}")
                logger.info(f"📈 Confidence percentage: {confidence*100:.2f}%")
                logger.info(f"📋 Raw Vosk result: {result}")
                logger.info("=" * 80)
                
                # Clean up temporary WAV file if it was created
                if wav_path != audio_file_path:
                    try:
                        os.remove(wav_path)
                        logger.info(f"🗑️ Cleaned up temporary WAV file: {wav_path}")
                    except Exception as cleanup_error:
                        logger.warning(f"⚠️ Failed to clean up temporary file: {cleanup_error}")
                
                return transcription, confidence, duration
                
        except Exception as e:
            logger.error(f"Vosk transcription failed: {e}")
            raise Exception(f"Audio transcription failed: {str(e)}")
    
    def _convert_to_wav(self, audio_file_path: str) -> str:
        """Convert audio file to WAV format for Vosk processing"""
        try:
            # If already WAV, return as is
            if audio_file_path.lower().endswith('.wav'):
                # Check if it's actually a valid WAV file
                try:
                    with wave.open(audio_file_path, 'rb') as test_wav:
                        test_wav.getnframes()  # This will fail if not a valid WAV
                    return audio_file_path
                except:
                    logger.info(f"File {audio_file_path} has .wav extension but is not a valid WAV file")
                    # Continue with conversion
            
            # Convert to WAV using ffmpeg (more robust)
            logger.info(f"Converting {audio_file_path} to WAV format using ffmpeg")
            
            # Create temporary WAV file path
            temp_wav_path = audio_file_path + '.temp.wav'
            
            try:
                # Use ffmpeg to convert to WAV
                stream = ffmpeg.input(audio_file_path)
                stream = ffmpeg.output(stream, temp_wav_path, acodec='pcm_s16le', ac=1, ar=16000)
                ffmpeg.run(stream, overwrite_output=True, quiet=True)
                
                logger.info(f"Successfully converted to WAV: {temp_wav_path}")
                return temp_wav_path
                
            except Exception as ffmpeg_error:
                logger.warning(f"FFmpeg conversion failed: {ffmpeg_error}")
                
                # Fallback to soundfile if ffmpeg fails
                try:
                    audio_data, sample_rate = sf.read(audio_file_path)
                    
                    # Convert to mono if stereo
                    if len(audio_data.shape) > 1:
                        audio_data = np.mean(audio_data, axis=1)
                    
                    # Write as WAV
                    sf.write(temp_wav_path, audio_data, sample_rate, format='WAV')
                    
                    logger.info(f"Fallback conversion successful: {temp_wav_path}")
                    return temp_wav_path
                    
                except Exception as sf_error:
                    logger.error(f"Soundfile fallback also failed: {sf_error}")
                    raise Exception(f"Audio conversion failed with both ffmpeg and soundfile: {ffmpeg_error}, {sf_error}")
            
        except Exception as e:
            logger.error(f"Audio conversion failed: {e}")
            # Return original path if conversion fails
            return audio_file_path
    
    def _calculate_confidence(self, result: dict) -> float:
        """Calculate confidence score from Vosk result"""
        try:
            # Vosk doesn't provide direct confidence scores, so we estimate
            # based on the quality of the result
            
            text = result.get('text', '')
            if not text:
                return 0.0
            
            # Check for common confidence indicators
            confidence = 0.8  # Base confidence
            
            # Adjust based on result quality
            if 'partial' in result:
                confidence -= 0.2  # Partial results are less confident
            
            # Check for repeated words or gibberish
            words = text.split()
            if len(words) > 0:
                # Simple heuristic: longer, more diverse text tends to be more confident
                unique_words = len(set(words))
                word_diversity = unique_words / len(words)
                confidence += word_diversity * 0.1
            
            # Ensure confidence is between 0 and 1
            confidence = max(0.0, min(1.0, confidence))
            
            return confidence
            
        except Exception as e:
            logger.warning(f"Failed to calculate confidence: {e}")
            return 0.8  # Default confidence
    
    def is_model_available(self) -> bool:
        """Check if Vosk model is available and loaded"""
        return self.model is not None
    
    def get_model_info(self) -> dict:
        """Get information about the loaded model"""
        if not self.model:
            return {
                "status": "not_loaded",
                "message": "No Vosk model loaded"
            }
        
        return {
            "status": "loaded",
            "model_path": self.model_path,
            "model_size": self._get_model_size(),
            "supported_formats": ["wav", "mp3", "m4a", "flac", "ogg"]
        }
    
    def _get_model_size(self) -> str:
        """Get the size of the loaded model"""
        try:
            if os.path.exists(self.model_path):
                size_bytes = sum(
                    os.path.getsize(os.path.join(dirpath, filename))
                    for dirpath, dirnames, filenames in os.walk(self.model_path)
                    for filename in filenames
                )
                
                # Convert to human-readable format
                if size_bytes > 1024 * 1024 * 1024:  # GB
                    return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
                elif size_bytes > 1024 * 1024:  # MB
                    return f"{size_bytes / (1024 * 1024):.1f} MB"
                else:  # KB
                    return f"{size_bytes / 1024:.1f} KB"
            
            return "Unknown"
            
        except Exception as e:
            logger.warning(f"Failed to get model size: {e}")
            return "Unknown"

# Create global instance
vosk_transcription_service = VoskTranscriptionService() 
