import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.email_alert import EmailAlert
from app.models.user import User
from app.schemas.email_alert import (
    EmailAlertListResponse,
    EmailAlertResponse,
    EmailAlertStatsResponse,
)
from app.services.email_alert_service import email_alert_service
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email-alerts", tags=["Email Alerts"])


@router.get("/", response_model=EmailAlertListResponse)
async def get_user_email_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """Get email alerts for the current user."""
    try:
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Build query
        query = db.query(EmailAlert).filter(EmailAlert.user_id == current_user.id)
        
        if alert_type:
            query = query.filter(EmailAlert.alert_type == alert_type)
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        alerts = (
            query.order_by(EmailAlert.created_at.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
        
        return EmailAlertListResponse(
            alerts=[EmailAlertResponse.from_orm(alert) for alert in alerts],
            total=total,
            page=page,
            per_page=per_page,
        )
        
    except Exception as e:
        logger.error(f"Error fetching email alerts for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email alerts")


@router.get("/{alert_id}", response_model=EmailAlertResponse)
async def get_email_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific email alert by ID."""
    try:
        alert = (
            db.query(EmailAlert)
            .filter(
                EmailAlert.id == alert_id,
                EmailAlert.user_id == current_user.id,
            )
            .first()
        )
        
        if not alert:
            raise HTTPException(status_code=404, detail="Email alert not found")
        
        return EmailAlertResponse.from_orm(alert)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching email alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email alert")


@router.get("/stats/summary", response_model=EmailAlertStatsResponse)
async def get_email_alert_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get email alert statistics for the current user."""
    try:
        # Get all alerts for the user
        alerts = db.query(EmailAlert).filter(EmailAlert.user_id == current_user.id).all()
        
        # Calculate statistics
        total_alerts = len(alerts)
        successful_alerts = len([a for a in alerts if a.sent_successfully])
        failed_alerts = len([a for a in alerts if not a.sent_successfully])
        pending_retries = len([a for a in alerts if not a.sent_successfully and a.retry_count < a.max_retries])
        
        # Count by alert type
        alert_types = {}
        for alert in alerts:
            alert_types[alert.alert_type] = alert_types.get(alert.alert_type, 0) + 1
        
        # Get recent alerts (last 10)
        recent_alerts = (
            db.query(EmailAlert)
            .filter(EmailAlert.user_id == current_user.id)
            .order_by(EmailAlert.created_at.desc())
            .limit(10)
            .all()
        )
        
        return EmailAlertStatsResponse(
            total_alerts=total_alerts,
            successful_alerts=successful_alerts,
            failed_alerts=failed_alerts,
            pending_retries=pending_retries,
            alert_types=alert_types,
            recent_alerts=[EmailAlertResponse.from_orm(alert) for alert in recent_alerts],
        )
        
    except Exception as e:
        logger.error(f"Error fetching email alert stats for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email alert statistics")


@router.post("/retry-failed")
async def retry_failed_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retry failed email alerts for the current user."""
    try:
        # Get failed alerts for the user
        failed_alerts = (
            db.query(EmailAlert)
            .filter(
                EmailAlert.user_id == current_user.id,
                EmailAlert.sent_successfully == False,
                EmailAlert.retry_count < EmailAlert.max_retries,
            )
            .all()
        )
        
        if not failed_alerts:
            return {"message": "No failed alerts to retry", "retried_count": 0}
        
        # Retry alerts using the email alert service
        retried_count = email_alert_service.retry_failed_alerts(db, max_retries=3)
        
        return {
            "message": f"Retried {retried_count} failed alerts",
            "retried_count": retried_count,
        }
        
    except Exception as e:
        logger.error(f"Error retrying failed alerts for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retry failed alerts")


@router.delete("/{alert_id}")
async def delete_email_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific email alert."""
    try:
        alert = (
            db.query(EmailAlert)
            .filter(
                EmailAlert.id == alert_id,
                EmailAlert.user_id == current_user.id,
            )
            .first()
        )
        
        if not alert:
            raise HTTPException(status_code=404, detail="Email alert not found")
        
        db.delete(alert)
        db.commit()
        
        return {"message": "Email alert deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting email alert {alert_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete email alert")


@router.get("/types/available")
async def get_available_alert_types():
    """Get available email alert types."""
    return {
        "alert_types": [
            {
                "type": "immediate_voice",
                "name": "Immediate Voice Alert",
                "description": "Sent immediately when user uploads voice audio",
            },
            {
                "type": "onboarding_analysis",
                "name": "Onboarding Analysis Alert",
                "description": "Sent when audio analysis fails and onboarding data is analyzed",
            },
            {
                "type": "critical_risk",
                "name": "Critical Risk Alert",
                "description": "Sent when critical mental health risk is detected",
            },
            {
                "type": "daily_summary",
                "name": "Daily Summary",
                "description": "Daily summary of user's mental health status",
            },
        ]
    }
