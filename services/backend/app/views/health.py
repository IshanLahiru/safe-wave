import logging
import os
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, get_db, get_connection_stats, health_check_database, optimize_database_settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "message": "Safe Wave API is running", "version": "2.0.0"}


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with system status"""
    try:
        # Check database connection
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    # Check upload directories
    audio_dir_status = "healthy" if os.path.exists(settings.AUDIO_UPLOAD_DIR) else "unhealthy"
    doc_dir_status = "healthy" if os.path.exists(settings.DOCUMENT_UPLOAD_DIR) else "unhealthy"

    # Check OpenAI configuration
    openai_status = "configured" if settings.OPENAI_API_KEY else "not_configured"

    return {
        "status": (
            "healthy"
            if all(
                [db_status == "healthy", audio_dir_status == "healthy", doc_dir_status == "healthy"]
            )
            else "degraded"
        ),
        "timestamp": "2024-01-01T00:00:00Z",
        "version": "2.0.0",
        "components": {
            "database": db_status,
            "audio_storage": audio_dir_status,
            "document_storage": doc_dir_status,
            "openai": openai_status,
        },
        "storage": {
            "audio_directory": settings.AUDIO_UPLOAD_DIR,
            "document_directory": settings.DOCUMENT_UPLOAD_DIR,
            "max_file_size_mb": f"{settings.MAX_FILE_SIZE / (1024*1024):.1f}",
        },
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check for deployment"""
    try:
        # Check database
        db = next(get_db())
        db.execute(text("SELECT 1"))

        # Check directories
        if not os.path.exists(settings.AUDIO_UPLOAD_DIR):
            os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)
        if not os.path.exists(settings.DOCUMENT_UPLOAD_DIR):
            os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)

        return {"status": "ready", "message": "All systems operational"}

    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/db-test")
async def database_connection_test():
    """Test database connection specifically for debugging"""
    try:
        db = next(get_db())

        # Test basic query
        result = db.execute(text("SELECT 1 as test_value, NOW() as current_time"))
        row = result.fetchone()

        # Test token table access
        try:
            token_result = db.execute(
                text("SELECT COUNT(*) as token_count FROM blacklisted_tokens")
            )
            token_count = token_result.fetchone().token_count
        except Exception as token_error:
            token_count = f"Error: {str(token_error)}"

        # Test connection pool status
        pool_status = {
            "pool_size": engine.pool.size(),
            "checked_in": engine.pool.checkedin(),
            "checked_out": engine.pool.checkedout(),
            "overflow": engine.pool.overflow(),
        }

        return {
            "status": "success",
            "database": "connected",
            "test_query": {"test_value": row.test_value, "current_time": str(row.current_time)},
            "token_table": {
                "accessible": "yes" if "Error:" not in str(token_count) else "no",
                "count": token_count,
            },
            "connection_pool": pool_status,
        }

    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return {"status": "error", "database": "disconnected", "error": str(e)}


@router.get("/performance")
async def performance_metrics():
    """Get comprehensive performance metrics"""
    try:
        # Get database connection stats
        db_stats = get_connection_stats()
        
        # Get database health check
        db_health = health_check_database()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "health": db_health["status"],
                "response_time": db_health.get("response_time", 0),
                "connection_pool": {
                    "total_connections": db_stats["total_connections"],
                    "active_connections": db_stats["active_connections"],
                    "pool_size": db_stats["pool_size"],
                    "pool_checked_in": db_stats["pool_checked_in"],
                    "pool_checked_out": db_stats["pool_checked_out"],
                    "pool_overflow": db_stats["pool_overflow"],
                    "utilization_percent": db_health.get("pool_health", {}).get("utilization", 0)
                },
                "query_performance": {
                    "total_queries": db_stats["query_count"],
                    "slow_queries": db_stats["slow_queries"],
                    "avg_query_time": round(db_stats["avg_query_time"], 4),
                    "pool_hits": db_stats["pool_hits"],
                    "connection_errors": db_stats["connection_errors"]
                }
            },
            "system": {
                "storage": {
                    "audio_dir_exists": os.path.exists(settings.AUDIO_UPLOAD_DIR),
                    "document_dir_exists": os.path.exists(settings.DOCUMENT_UPLOAD_DIR)
                },
                "configuration": {
                    "openai_configured": bool(settings.OPENAI_API_KEY),
                    "openrouter_configured": bool(settings.OPENROUTER_API_KEY),
                    "smtp_configured": bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD)
                }
            }
        }
    except Exception as e:
        logger.error(f"Performance metrics failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/database-stats")
async def database_statistics():
    """Get detailed database performance statistics"""
    try:
        stats = get_connection_stats()
        health = health_check_database()
        
        return {
            "connection_stats": stats,
            "health_check": health,
            "recommendations": _get_performance_recommendations(stats, health)
        }
    except Exception as e:
        logger.error(f"Database stats failed: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/optimize-database")
async def trigger_database_optimization():
    """Trigger database performance optimizations"""
    try:
        optimize_database_settings()
        return {
            "status": "success",
            "message": "Database optimizations applied",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Database optimization failed: {e}")
        return {"status": "error", "error": str(e)}


@router.get("/cache-test")
async def cache_performance_test():
    """Test endpoint for cache performance validation"""
    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "cache_headers": "This endpoint should have cache headers",
        "test_data": {
            "random_value": int(time.time()),
            "message": "This response should be cached for 5 minutes"
        }
    }


def _get_performance_recommendations(stats: dict, health: dict) -> list:
    """Generate performance recommendations based on current metrics"""
    recommendations = []
    
    # Check pool utilization
    utilization = health.get("pool_health", {}).get("utilization", 0)
    if utilization > 80:
        recommendations.append({
            "type": "warning",
            "metric": "connection_pool_utilization",
            "value": f"{utilization}%",
            "recommendation": "Consider increasing pool_size or max_overflow"
        })
    
    # Check slow queries
    if stats["slow_queries"] > 10:
        recommendations.append({
            "type": "warning",
            "metric": "slow_queries",
            "value": stats["slow_queries"],
            "recommendation": "Review and optimize slow queries, ensure indexes are in place"
        })
    
    # Check average query time
    if stats["avg_query_time"] > 0.1:  # 100ms
        recommendations.append({
            "type": "info",
            "metric": "avg_query_time",
            "value": f"{stats['avg_query_time']:.4f}s",
            "recommendation": "Consider adding database indexes for frequently queried columns"
        })
    
    # Check connection errors
    if stats["connection_errors"] > 5:
        recommendations.append({
            "type": "error",
            "metric": "connection_errors",
            "value": stats["connection_errors"],
            "recommendation": "Investigate database connectivity issues"
        })
    
    return recommendations
