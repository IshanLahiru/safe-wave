import os
import logging
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, engine
from app.core.config import settings
from app.utils.config_validator import get_config_status

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "message": "Safe Wave API is running",
        "version": "2.0.0"
    }

@router.get("/config")
async def config_status():
    """Check configuration status and provide helpful error messages"""
    try:
        config_status = get_config_status()

        return {
            "status": "valid" if config_status["is_valid"] else "invalid",
            "message": config_status["summary"],
            "details": {
                "errors": config_status["errors"],
                "warnings": config_status["warnings"],
                "total_issues": len(config_status["errors"]) + len(config_status["warnings"])
            }
        }
    except Exception as e:
        logger.error(f"Failed to check configuration: {e}")
        return {
            "status": "error",
            "message": f"Couldn't check configuration: {str(e)}",
            "details": {"errors": [str(e)], "warnings": [], "total_issues": 1}
        }

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
        "status": "healthy" if all([db_status == "healthy", audio_dir_status == "healthy", doc_dir_status == "healthy"]) else "degraded",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": "2.0.0",
        "components": {
            "database": db_status,
            "audio_storage": audio_dir_status,
            "document_storage": doc_dir_status,
            "openai": openai_status
        },
        "storage": {
            "audio_directory": settings.AUDIO_UPLOAD_DIR,
            "document_directory": settings.DOCUMENT_UPLOAD_DIR,
            "max_file_size_mb": f"{settings.MAX_FILE_SIZE / (1024*1024):.1f}"
        }
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
            token_result = db.execute(text("SELECT COUNT(*) as token_count FROM blacklisted_tokens"))
            token_count = token_result.fetchone().token_count
        except Exception as token_error:
            token_count = f"Error: {str(token_error)}"
        
        # Test connection pool status
        pool_status = {
            "pool_size": engine.pool.size(),
            "checked_in": engine.pool.checkedin(),
            "checked_out": engine.pool.checkedout(),
            "overflow": engine.pool.overflow()
        }
        
        return {
            "status": "success",
            "database": "connected",
            "test_query": {
                "test_value": row.test_value,
                "current_time": str(row.current_time)
            },
            "token_table": {
                "accessible": "yes" if "Error:" not in str(token_count) else "no",
                "count": token_count
            },
            "connection_pool": pool_status
        }
        
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e)
        }
