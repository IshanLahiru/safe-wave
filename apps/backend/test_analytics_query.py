#!/usr/bin/env python3
"""
Script to test analytics queries directly from the database
"""

import sys
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import SessionLocal
from app.models.audio import Audio
from app.models.user import User

def test_analytics_queries():
    """Test analytics queries directly from the database"""
    db = SessionLocal()
    
    try:
        # Get the first user
        user = db.query(User).first()
        if not user:
            print("No users found.")
            return
        
        print(f"Testing analytics for user: {user.email}")
        
        # Get current time
        now = datetime.now(timezone.utc)
        
        # Test different periods
        periods = ["week", "month", "quarter", "year"]
        
        for period in periods:
            print(f"\n📊 Testing {period.upper()} analytics:")
            
            # Calculate date range
            if period == "week":
                start_date = now - timedelta(days=now.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=7)
            elif period == "month":
                start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if now.month == 12:
                    end_date = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                else:
                    end_date = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
            elif period == "quarter":
                quarter = (now.month - 1) // 3 + 1
                start_month = (quarter - 1) * 3 + 1
                start_date = now.replace(month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
                if quarter == 4:
                    end_date = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                else:
                    end_date = now.replace(month=start_month + 3, day=1, hour=0, minute=0, second=0, microsecond=0)
            elif period == "year":
                start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Query audio records for this period
            period_audios = db.query(Audio).filter(
                Audio.user_id == user.id,
                Audio.created_at >= start_date,
                Audio.created_at < end_date
            ).all()
            
            # Calculate metrics
            total_checkins = len(period_audios)
            completed_checkins = len([a for a in period_audios if a.transcription_status == "completed"])
            completion_rate = (completed_checkins / total_checkins * 100) if total_checkins > 0 else 0
            
            # Calculate average duration
            durations = [a.duration for a in period_audios if a.duration is not None]
            avg_duration = sum(durations) / len(durations) if durations else 0
            
            # Risk level distribution
            risk_levels = {}
            for audio in period_audios:
                if audio.risk_level:
                    risk_levels[audio.risk_level] = risk_levels.get(audio.risk_level, 0) + 1
            
            # Daily pattern
            daily_pattern = {
                "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0,
                "Friday": 0, "Saturday": 0, "Sunday": 0
            }
            
            for audio in period_audios:
                day_name = audio.created_at.strftime("%A")
                daily_pattern[day_name] = daily_pattern.get(day_name, 0) + 1
            
            print(f"   Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
            print(f"   Total check-ins: {total_checkins}")
            print(f"   Completed: {completed_checkins}")
            print(f"   Completion rate: {completion_rate:.1f}%")
            print(f"   Average duration: {avg_duration:.1f}s")
            print(f"   Risk distribution: {risk_levels}")
            print(f"   Daily pattern: {daily_pattern}")
            
            # Show recent activity
            recent_activity = sorted(period_audios, key=lambda x: x.created_at, reverse=True)[:3]
            print(f"   Recent activity: {len(recent_activity)} records")
            for audio in recent_activity:
                print(f"     - {audio.created_at.strftime('%Y-%m-%d %H:%M')}: {audio.transcription_status} ({audio.risk_level or 'N/A'})")
        
        # Test overall metrics
        print(f"\n📈 OVERALL METRICS:")
        all_audios = db.query(Audio).filter(Audio.user_id == user.id).all()
        total_all = len(all_audios)
        completed_all = len([a for a in all_audios if a.transcription_status == "completed"])
        completion_rate_all = (completed_all / total_all * 100) if total_all > 0 else 0
        
        print(f"   Total all-time check-ins: {total_all}")
        print(f"   Total completed: {completed_all}")
        print(f"   Overall completion rate: {completion_rate_all:.1f}%")
        
        # Overall risk distribution
        overall_risk = {}
        for audio in all_audios:
            if audio.risk_level:
                overall_risk[audio.risk_level] = overall_risk.get(audio.risk_level, 0) + 1
        print(f"   Overall risk distribution: {overall_risk}")
        
    except Exception as e:
        print(f"❌ Error testing analytics: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_analytics_queries()
