from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings
from app.models.base import Base
import logging

logger = logging.getLogger(__name__)

# Create engine with connection pooling and retry logic
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections when pool is full
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections every hour
    pool_timeout=30,  # Timeout for getting connection from pool
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is imported from app.models.base

def get_db():
    db = SessionLocal()
    try:
        # Test the connection before yielding
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        try:
            db.rollback()
        except:
            pass
        raise
    finally:
        try:
            db.close()
        except:
            pass

def get_db_with_retry(max_retries=3):
    """Get database session with retry logic for connection issues"""
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Test the connection
            db.execute(text("SELECT 1"))
            return db
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            try:
                db.close()
            except:
                pass
            
            if attempt == max_retries - 1:
                logger.error("All database connection attempts failed")
                raise
            else:
                import time
                time.sleep(1)  # Wait before retry
