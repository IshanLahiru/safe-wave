import calendar
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, extract, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audio import Audio
from app.models.user import User
from app.views.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_date_range(period: str) -> tuple[datetime, datetime]:
    """Get start and end dates for the specified period"""
    now = datetime.now(timezone.utc)

    if period == "week":
        # Start of current week (Monday)
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7)

    elif period == "month":
        # Start of current month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of current month
        if now.month == 12:
            end_date = now.replace(
                year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
        else:
            end_date = now.replace(
                month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0
            )

    elif period == "quarter":
        # Calculate current quarter
        quarter = (now.month - 1) // 3 + 1
        start_month = (quarter - 1) * 3 + 1
        start_date = now.replace(
            month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0
        )

        if quarter == 4:
            end_date = now.replace(
                year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
        else:
            end_date = now.replace(
                month=start_month + 3, day=1, hour=0, minute=0, second=0, microsecond=0
            )

    elif period == "year":
        # Start of current year
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        # Start of next year
        end_date = now.replace(
            year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0
        )

    else:
        raise ValueError(f"Invalid period: {period}")

    return start_date, end_date


def calculate_trend(current: float, previous: float) -> str:
    """Calculate trend percentage"""
    if previous == 0:
        return "+100%" if current > 0 else "0%"

    change = ((current - previous) / previous) * 100
    if change > 0:
        return f"+{round(change, 1)}%"
    else:
        return f"{round(change, 1)}%"


def get_time_ago(timestamp: datetime) -> str:
    """Convert timestamp to human-readable time ago string"""
    now = datetime.now(timezone.utc)
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    diff = now - timestamp

    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"


@router.get("/dashboard")
async def get_user_analytics(
    period: str = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive analytics data for the current user based on real database queries"""
    try:
        logger.info(f"Getting analytics for user {current_user.id} for period: {period}")

        if period not in ["week", "month", "quarter", "year"]:
            raise HTTPException(status_code=400, detail="Invalid period")

        # Get date range for current period
        current_start, current_end = get_date_range(period)

        # Get user's audio records for current period
        current_period_audios = (
            db.query(Audio)
            .filter(
                and_(
                    Audio.user_id == current_user.id,
                    Audio.created_at >= current_start,
                    Audio.created_at < current_end,
                )
            )
            .all()
        )

        # Get all user's audio records (for total metrics)
        all_user_audios = db.query(Audio).filter(Audio.user_id == current_user.id).all()

        # Calculate metrics
        current_total_checkins = len(current_period_audios)
        current_completed_checkins = len(
            [a for a in current_period_audios if a.transcription_status == "completed"]
        )
        current_completion_rate = (
            (current_completed_checkins / current_total_checkins * 100)
            if current_total_checkins > 0
            else 0
        )

        # Calculate average duration
        current_durations = [a.duration for a in current_period_audios if a.duration is not None]
        avg_duration = sum(current_durations) / len(current_durations) if current_durations else 0

        # Risk level distribution
        risk_levels = {}
        for audio in current_period_audios:
            if audio.risk_level:
                risk_levels[audio.risk_level] = risk_levels.get(audio.risk_level, 0) + 1

        # Daily pattern
        daily_pattern = {
            "Monday": 0,
            "Tuesday": 0,
            "Wednesday": 0,
            "Thursday": 0,
            "Friday": 0,
            "Saturday": 0,
            "Sunday": 0,
        }

        for audio in current_period_audios:
            day_name = audio.created_at.strftime("%A")
            daily_pattern[day_name] = daily_pattern.get(day_name, 0) + 1

        # Weekly trend
        weekly_trend = []
        if period == "week":
            for day_num in range(7):
                day_start = current_start + timedelta(days=day_num)
                day_end = day_start + timedelta(days=1)

                day_audios = [
                    a for a in current_period_audios if day_start <= a.created_at < day_end
                ]
                day_completed = len(
                    [a for a in day_audios if a.transcription_status == "completed"]
                )

                weekly_trend.append(
                    {
                        "week": day_start.strftime("%A"),
                        "checkins": len(day_audios),
                        "completed": day_completed,
                    }
                )
        elif period == "month":
            for week_num in range(1, 5):
                week_start = current_start + timedelta(weeks=week_num - 1)
                week_end = week_start + timedelta(weeks=1)

                week_audios = [
                    a for a in current_period_audios if week_start <= a.created_at < week_end
                ]
                week_completed = len(
                    [a for a in week_audios if a.transcription_status == "completed"]
                )

                weekly_trend.append(
                    {
                        "week": f"Week {week_num}",
                        "checkins": len(week_audios),
                        "completed": week_completed,
                    }
                )
        elif period == "quarter":
            for week_num in range(1, 13):
                week_start = current_start + timedelta(weeks=week_num - 1)
                week_end = week_start + timedelta(weeks=1)

                week_audios = [
                    a for a in current_period_audios if week_start <= a.created_at < week_end
                ]
                week_completed = len(
                    [a for a in week_audios if a.transcription_status == "completed"]
                )

                weekly_trend.append(
                    {
                        "week": f"Week {week_num}",
                        "checkins": len(week_audios),
                        "completed": week_completed,
                    }
                )
        elif period == "year":
            for month_num in range(1, 13):
                month_start = current_start.replace(month=month_num)
                if month_num == 12:
                    month_end = current_end
                else:
                    month_end = current_start.replace(month=month_num + 1)

                month_audios = [
                    a for a in current_period_audios if month_start <= a.created_at < month_end
                ]
                month_completed = len(
                    [a for a in month_audios if a.transcription_status == "completed"]
                )

                weekly_trend.append(
                    {
                        "week": calendar.month_name[month_num],
                        "checkins": len(month_audios),
                        "completed": month_completed,
                    }
                )

        # Recent activity
        recent_activity = []
        sorted_audios = sorted(current_period_audios, key=lambda x: x.created_at, reverse=True)
        for audio in sorted_audios[:10]:
            recent_activity.append(
                {
                    "id": str(audio.id),
                    "type": "check-in",
                    "status": audio.transcription_status,
                    "risk_level": audio.risk_level,
                    "duration": audio.duration,
                    "timestamp": audio.created_at.isoformat(),
                    "time_ago": get_time_ago(audio.created_at),
                }
            )

        # Generate insights
        insights = generate_insights(current_period_audios, daily_pattern, risk_levels, period)

        return {
            "period": period,
            "metrics": {
                "total_checkins": len(all_user_audios),
                "period_checkins": current_total_checkins,
                "completion_rate": round(
                    (
                        (
                            len(
                                [
                                    a
                                    for a in all_user_audios
                                    if a.transcription_status == "completed"
                                ]
                            )
                            / len(all_user_audios)
                            * 100
                        )
                        if all_user_audios
                        else 0
                    ),
                    1,
                ),
                "period_completion_rate": round(current_completion_rate, 1),
                "avg_duration": round(avg_duration, 2),
                "checkin_trend": "+0%",
                "completion_trend": "+0%",
            },
            "risk_distribution": risk_levels,
            "daily_pattern": daily_pattern,
            "weekly_trend": weekly_trend,
            "recent_activity": recent_activity,
            "insights": insights,
        }

    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analytics data")


def generate_insights(
    audios: List[Audio], daily_pattern: Dict, risk_levels: Dict, period: str
) -> List[Dict]:
    """Generate performance insights based on real data"""
    insights = []

    if not audios:
        insights.append(
            {
                "type": "info",
                "title": "No Activity",
                "value": "No check-ins",
                "description": f"No voice check-ins recorded for this {period}. Start your journey by making your first check-in!",
            }
        )
        return insights

    # Best performing day
    best_day = max(daily_pattern.items(), key=lambda x: x[1])
    if best_day[1] > 0:
        insights.append(
            {
                "type": "positive",
                "title": "Best Performance Day",
                "value": best_day[0],
                "description": f"Most active on {best_day[0]} with {best_day[1]} check-in{'s' if best_day[1] != 1 else ''}",
            }
        )

    # Risk level insights
    if risk_levels:
        most_common_risk = max(risk_levels.items(), key=lambda x: x[1])
        if most_common_risk[0] in ["high", "critical"]:
            insights.append(
                {
                    "type": "alert",
                    "title": "Risk Level Alert",
                    "value": f"{most_common_risk[0].title()} Risk",
                    "description": f"Most common risk level is {most_common_risk[0]} - consider seeking support",
                }
            )
        elif most_common_risk[0] in ["low", "medium"]:
            insights.append(
                {
                    "type": "positive",
                    "title": "Good Mental Health",
                    "value": f"{most_common_risk[0].title()} Risk",
                    "description": f"Maintaining good mental health with {most_common_risk[0]} risk levels",
                }
            )

    # Completion rate insight
    total_checkins = len(audios)
    completed_checkins = len([a for a in audios if a.transcription_status == "completed"])
    completion_rate = (completed_checkins / total_checkins * 100) if total_checkins > 0 else 0

    if completion_rate >= 90:
        insights.append(
            {
                "type": "success",
                "title": "High Completion Rate",
                "value": f"{round(completion_rate, 1)}%",
                "description": "Excellent completion rate for voice check-ins",
            }
        )

    return insights


@router.get("/test")
async def test_analytics():
    """Test endpoint for analytics (no authentication required)"""
    return {
        "message": "Analytics endpoint is working!",
        "test_data": {
            "period": "week",
            "metrics": {
                "total_checkins": 15,
                "period_checkins": 7,
                "completion_rate": 85.5,
                "period_completion_rate": 90.0,
                "avg_duration": 45.2,
                "checkin_trend": "+12%",
                "completion_trend": "+5%",
            },
            "risk_distribution": {"low": 8, "medium": 4, "high": 2, "critical": 1},
            "daily_pattern": {
                "Monday": 2,
                "Tuesday": 1,
                "Wednesday": 3,
                "Thursday": 2,
                "Friday": 1,
                "Saturday": 0,
                "Sunday": 0,
            },
            "weekly_trend": [
                {"week": "Week 1", "checkins": 0, "completed": 0},
                {"week": "Week 2", "checkins": 0, "completed": 0},
                {"week": "Week 3", "checkins": 0, "completed": 0},
                {"week": "Week 4", "checkins": 0, "completed": 0},
            ],
            "recent_activity": [
                {
                    "id": "1",
                    "type": "check-in",
                    "status": "completed",
                    "risk_level": "low",
                    "duration": 45.2,
                    "timestamp": "2024-01-01T10:00:00Z",
                    "time_ago": "2 hours ago",
                }
            ],
            "insights": [
                {
                    "type": "positive",
                    "title": "Best Performance Day",
                    "value": "Wednesday",
                    "description": "Most active on Wednesday with 3 check-ins",
                }
            ],
        },
    }


@router.get("/simple")
async def simple_analytics(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Simple analytics endpoint for testing"""
    try:
        user_audios = db.query(Audio).filter(Audio.user_id == current_user.id).all()

        total_checkins = len(user_audios)
        completed_checkins = len([a for a in user_audios if a.transcription_status == "completed"])
        completion_rate = (completed_checkins / total_checkins * 100) if total_checkins > 0 else 0

        risk_levels = {}
        for audio in user_audios:
            if audio.risk_level:
                risk_levels[audio.risk_level] = risk_levels.get(audio.risk_level, 0) + 1

        return {
            "total_checkins": total_checkins,
            "completed_checkins": completed_checkins,
            "completion_rate": round(completion_rate, 1),
            "risk_distribution": risk_levels,
            "message": "Simple analytics working!",
        }

    except Exception as e:
        logger.error(f"Simple analytics error: {e}")
        return {"error": str(e)}
