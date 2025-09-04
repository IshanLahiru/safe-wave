import logging
import time
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.engine import Engine

from app.core.config import settings

logger = logging.getLogger(__name__)

# Performance monitoring for database connections
connection_stats = {
    "total_connections": 0,
    "active_connections": 0,
    "pool_hits": 0,
    "pool_misses": 0,
    "query_count": 0,
    "slow_queries": 0,
    "avg_query_time": 0.0,
    "connection_errors": 0
}

# Create engine with optimized connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=15,  # Increased for better concurrency
    max_overflow=30,  # Higher overflow for peak loads
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=1800,  # Recycle connections every 30 minutes (reduced)
    pool_timeout=20,  # Reduced timeout for faster failure detection
    pool_reset_on_return='commit',  # Reset connections properly
    echo=False,  # Set to True for SQL debugging
    # Performance optimizations
    connect_args={
        "connect_timeout": 10,
        "application_name": "safewave_api",
        # PostgreSQL-specific optimizations
        "options": "-c default_transaction_isolation=read_committed -c statement_timeout=30000"
    }
)

# Connection pool monitoring events
@event.listens_for(engine, "connect")
def on_connect(dbapi_connection, connection_record):
    """Track connection creation"""
    connection_stats["total_connections"] += 1
    connection_stats["active_connections"] += 1
    logger.debug(f"Database connection created. Active: {connection_stats['active_connections']}")

@event.listens_for(engine, "checkout")
def on_checkout(dbapi_connection, connection_record, connection_proxy):
    """Track connection checkout from pool"""
    connection_stats["pool_hits"] += 1

@event.listens_for(engine, "invalidate")
def on_invalidate(dbapi_connection, connection_record, exception):
    """Track connection invalidations"""
    connection_stats["connection_errors"] += 1
    logger.warning(f"Database connection invalidated: {exception}")

# Query performance monitoring
@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Start query timing"""
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """End query timing and log slow queries"""
    total_time = time.time() - context._query_start_time
    connection_stats["query_count"] += 1
    
    # Update average query time
    connection_stats["avg_query_time"] = (
        (connection_stats["avg_query_time"] * (connection_stats["query_count"] - 1) + total_time)
        / connection_stats["query_count"]
    )
    
    # Log slow queries (>500ms)
    if total_time > 0.5:
        connection_stats["slow_queries"] += 1
        logger.warning(
            f"Slow query detected ({total_time:.3f}s): {statement[:200]}..."
        )

# Optimized session factory with performance monitoring
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    # Performance optimizations
    expire_on_commit=False  # Keep objects accessible after commit
)

Base = declarative_base()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions with proper cleanup"""
    db = SessionLocal()
    try:
        # Quick health check
        db.execute(text("SELECT 1"))
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        connection_stats["connection_errors"] += 1
        logger.error(f"Database transaction error: {e}")
        raise
    finally:
        db.close()
        connection_stats["active_connections"] = max(0, connection_stats["active_connections"] - 1)


def get_db():
    """FastAPI dependency for database sessions"""
    db = SessionLocal()
    try:
        # Quick connection test
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        connection_stats["connection_errors"] += 1
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            db.close()
            connection_stats["active_connections"] = max(0, connection_stats["active_connections"] - 1)
        except Exception:
            pass


def get_db_with_retry(max_retries=3):
    """Get database session with exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Test the connection
            db.execute(text("SELECT 1"))
            return db
        except Exception as e:
            logger.warning(
                f"Database connection attempt {attempt + 1} failed: {e}"
            )
            connection_stats["connection_errors"] += 1
            try:
                db.close()
            except Exception:
                pass

            if attempt == max_retries - 1:
                logger.error("All database connection attempts failed")
                raise
            else:
                import time
                # Exponential backoff: 1s, 2s, 4s
                wait_time = 2 ** attempt
                time.sleep(wait_time)


def get_connection_stats() -> dict:
    """Get current database connection statistics"""
    pool = engine.pool
    return {
        **connection_stats,
        "pool_size": pool.size(),
        "pool_checked_in": pool.checkedin(),
        "pool_checked_out": pool.checkedout(),
        "pool_overflow": pool.overflow(),
        "pool_invalid": pool.invalid()
    }


def health_check_database() -> dict:
    """Comprehensive database health check"""
    start_time = time.time()
    stats = get_connection_stats()
    
    try:
        with get_db_context() as db:
            # Test basic connectivity
            result = db.execute(text("SELECT 1 as health_check")).fetchone()
            
            # Test write capability
            db.execute(text("CREATE TEMP TABLE IF NOT EXISTS health_test (id INT)"))
            db.execute(text("INSERT INTO health_test VALUES (1)"))
            db.execute(text("DROP TABLE health_test"))
            
        response_time = time.time() - start_time
        
        return {
            "status": "healthy",
            "response_time": round(response_time, 3),
            "connection_stats": stats,
            "pool_health": {
                "utilization": round(
                    (stats["pool_checked_out"] / (stats["pool_size"] + stats["pool_overflow"])) * 100, 2
                ) if (stats["pool_size"] + stats["pool_overflow"]) > 0 else 0,
                "overflow_usage": stats["pool_overflow"],
                "invalid_connections": stats["pool_invalid"]
            },
            "performance": {
                "avg_query_time": round(stats["avg_query_time"], 3),
                "slow_queries": stats["slow_queries"],
                "total_queries": stats["query_count"]
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "response_time": time.time() - start_time,
            "connection_stats": stats
        }


def optimize_database_settings():
    """Apply database-specific optimizations"""
    try:
        with get_db_context() as db:
            # PostgreSQL-specific optimizations
            optimizations = [
                "SET work_mem = '256MB'",  # Increase work memory for complex queries
                "SET maintenance_work_mem = '512MB'",  # Increase maintenance memory
                "SET effective_cache_size = '2GB'",  # Assume 2GB available for caching
                "SET random_page_cost = 1.1",  # SSD optimization
                "SET checkpoint_completion_target = 0.9",  # Checkpoint optimization
            ]
            
            for optimization in optimizations:
                try:
                    db.execute(text(optimization))
                    logger.debug(f"Applied database optimization: {optimization}")
                except Exception as e:
                    logger.warning(f"Failed to apply optimization {optimization}: {e}")
                    
    except Exception as e:
        logger.error(f"Failed to apply database optimizations: {e}")
