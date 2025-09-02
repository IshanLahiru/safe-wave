#!/usr/bin/env python3
"""
Script to add test audio data for analytics testing
"""

import sys
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import SessionLocal, engine
from app.models.audio import Audio
from app.models.user import User

def create_test_data():
    """Create test audio data for analytics testing"""
    db = SessionLocal()
    
    try:
        # Get the first user (or create one if none exists)
        user = db.query(User).first()
        if not user:
            print("No users found. Please create a user first.")
            return
        
        print(f"Adding test data for user: {user.email}")
        
        # Get current time
        now = datetime.now(timezone.utc)
        
        # Create test audio records for the past week
        test_audios = []
        
        # Last 7 days with varying data
        for i in range(7):
            date = now - timedelta(days=i)
            
            # Create 1-3 audio records per day
            num_records = (i % 3) + 1  # 1, 2, 3, 1, 2, 3, 1
            
            for j in range(num_records):
                # Vary the time within the day
                hour = 9 + (j * 4)  # 9 AM, 1 PM, 5 PM
                record_time = date.replace(hour=hour, minute=0, second=0, microsecond=0)
                
                # Vary risk levels
                risk_levels = ['low', 'medium', 'high', 'critical']
                risk_level = risk_levels[(i + j) % 4]
                
                # Vary durations
                durations = [30.5, 45.2, 60.8, 25.3, 90.1]
                duration = durations[(i + j) % 5]
                
                # Vary transcription status
                statuses = ['completed', 'completed', 'completed', 'pending', 'failed']
                status = statuses[(i + j) % 5]
                
                audio = Audio(
                    user_id=user.id,
                    filename=f"test_audio_{i}_{j}.wav",
                    file_path=f"uploads/audio/test_audio_{i}_{j}.wav",
                    file_size=1024000,  # 1MB
                    duration=duration,
                    content_type="audio/wav",
                    transcription=f"Test transcription for audio {i}_{j}",
                    transcription_confidence=0.85,
                    transcription_status=status,
                    analysis_status="completed" if status == "completed" else "pending",
                    risk_level=risk_level if status == "completed" else None,
                    mental_health_indicators={
                        "mood": "neutral",
                        "stress_level": "medium",
                        "anxiety_indicators": ["restlessness", "worry"]
                    },
                    summary=f"Test summary for audio {i}_{j}",
                    recommendations=["Consider meditation", "Take breaks"],
                    description=f"Test audio recording {i}_{j}",
                    mood_rating=6,
                    tags=["test", "analytics"],
                    created_at=record_time,
                    updated_at=record_time
                )
                
                test_audios.append(audio)
        
        # Add some older data for trend analysis (previous week)
        for i in range(7, 14):
            date = now - timedelta(days=i)
            
            # Fewer records for previous week
            num_records = max(1, (i % 2) + 1)  # 1 or 2 records
            
            for j in range(num_records):
                hour = 10 + (j * 6)  # 10 AM, 4 PM
                record_time = date.replace(hour=hour, minute=0, second=0, microsecond=0)
                
                risk_levels = ['low', 'medium', 'high']
                risk_level = risk_levels[(i + j) % 3]
                
                durations = [40.0, 55.5, 35.2]
                duration = durations[(i + j) % 3]
                
                audio = Audio(
                    user_id=user.id,
                    filename=f"test_audio_prev_{i}_{j}.wav",
                    file_path=f"uploads/audio/test_audio_prev_{i}_{j}.wav",
                    file_size=1024000,
                    duration=duration,
                    content_type="audio/wav",
                    transcription=f"Previous week transcription {i}_{j}",
                    transcription_confidence=0.82,
                    transcription_status="completed",
                    analysis_status="completed",
                    risk_level=risk_level,
                    mental_health_indicators={
                        "mood": "positive",
                        "stress_level": "low",
                        "anxiety_indicators": []
                    },
                    summary=f"Previous week summary {i}_{j}",
                    recommendations=["Continue current routine"],
                    description=f"Previous week audio {i}_{j}",
                    mood_rating=7,
                    tags=["test", "previous"],
                    created_at=record_time,
                    updated_at=record_time
                )
                
                test_audios.append(audio)
        
        # Add the records to the database
        db.add_all(test_audios)
        db.commit()
        
        print(f"✅ Successfully added {len(test_audios)} test audio records")
        print(f"📊 Data spans from {(now - timedelta(days=13)).strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}")
        
        # Show summary
        total_checkins = len(test_audios)
        completed_checkins = len([a for a in test_audios if a.transcription_status == "completed"])
        completion_rate = (completed_checkins / total_checkins * 100) if total_checkins > 0 else 0
        
        print(f"\n📈 Summary:")
        print(f"   Total check-ins: {total_checkins}")
        print(f"   Completed: {completed_checkins}")
        print(f"   Completion rate: {completion_rate:.1f}%")
        
        # Risk distribution
        risk_counts = {}
        for audio in test_audios:
            if audio.risk_level:
                risk_counts[audio.risk_level] = risk_counts.get(audio.risk_level, 0) + 1
        
        print(f"   Risk distribution: {risk_counts}")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()
