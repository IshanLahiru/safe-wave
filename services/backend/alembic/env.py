import os
import sys
import time
from typing import Optional

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from logging.config import fileConfig
from sqlalchemy import create_engine, text

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import app configuration and models
try:
    from app.core.config import settings
    from app.core.database import Base
    from app.models.audio import Audio
    from app.models.email_alert import EmailAlert
    from app.models.content import (
        Article,
        ContentCategory,
        MealPlan,
        Quote,
        UserFavorite,
        UserProgress,
        Video,
    )
    from app.models.document import Document
    from app.models.token import BlacklistedToken
    from app.models.user import User
except ImportError as e:
    print(f"❌ Failed to import application modules: {e}")
    print("💡 Make sure you're running from the correct directory and dependencies are installed")
    sys.exit(1)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def detect_environment() -> str:
    """Detect the current environment (local, docker, production)."""
    # Check for Docker environment
    if os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER'):
        return 'docker'
    
    # Check for production indicators
    if settings.ENVIRONMENT == 'production':
        return 'production'
    
    # Default to local development
    return 'local'


def get_database_url_with_fallback() -> str:
    """
    Get database URL with environment-aware fallbacks and validation.
    
    Returns:
        str: Valid database URL for the current environment
        
    Raises:
        ValueError: If no valid database configuration is found
    """
    env_type = detect_environment()
    print(f"🔍 Detected environment: {env_type}")
    
    # Primary: Use configured DATABASE_URL if available
    if settings.DATABASE_URL:
        database_url = settings.DATABASE_URL
        print(f"📊 Using configured DATABASE_URL for {env_type} environment")
    else:
        # Fallback: Construct from components
        user = settings.POSTGRES_USER
        password = settings.POSTGRES_PASSWORD
        db = settings.POSTGRES_DB
        
        if env_type == 'docker':
            # In Docker, use internal service name and standard PostgreSQL port
            host = 'db'
            port = 5432
        else:
            # Local development or production
            host = settings.POSTGRES_HOST
            port = settings.POSTGRES_PORT
            
        database_url = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{db}"
        print(f"🔧 Constructed DATABASE_URL for {env_type}: postgresql+psycopg://{user}:***@{host}:{port}/{db}")
    
    return database_url


def validate_database_connection(url: str, max_retries: int = 10) -> bool:
    """
    Validate database connection with retry logic.
    
    Args:
        url: Database URL to test
        max_retries: Maximum number of retry attempts
        
    Returns:
        bool: True if connection successful, False otherwise
    """
    for attempt in range(max_retries):
        try:
            # Create a test engine with minimal configuration
            test_engine = create_engine(
                url,
                poolclass=pool.NullPool,
                connect_args={'connect_timeout': 10}
            )
            
            # Test connection
            with test_engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
                
            print(f"✅ Database connection successful")
            test_engine.dispose()
            return True
            
        except Exception as e:
            print(f"⚠️  Database connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                wait_time = min(2 ** attempt, 10)  # Exponential backoff with cap
                print(f"🕐 Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                print("❌ All database connection attempts failed")
                
    return False


def get_url():
    """
    Get database URL with comprehensive error handling and environment detection.
    
    Returns:
        str: Valid database URL
    """
    try:
        database_url = get_database_url_with_fallback()
        
        # Validate connection in non-offline mode
        if not context.is_offline_mode():
            if not validate_database_connection(database_url):
                raise ConnectionError(
                    "Unable to establish database connection. "
                    "Please check your database configuration and ensure the database is running."
                )
        
        return database_url
        
    except Exception as e:
        print(f"❌ Database configuration error: {e}")
        print("\n💡 Troubleshooting tips:")
        print("   1. Ensure your database is running")
        print("   2. Check environment variables in .env file")
        print("   3. Verify database credentials and connection details")
        print("   4. For Docker: ensure docker-compose services are up")
        raise


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode with enhanced error handling.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well. By skipping the Engine
    creation we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the script output.
    """
    try:
        print("🔄 Running migrations in OFFLINE mode")
        url = get_url()
        
        context.configure(
            url=url,
            target_metadata=target_metadata,
            literal_binds=True,
            dialect_opts={"paramstyle": "named"},
            compare_type=True,  # Enable type comparison for better migrations
            compare_server_default=True,  # Compare server defaults
        )

        with context.begin_transaction():
            context.run_migrations()
            
        print("✅ Offline migrations completed successfully")
        
    except Exception as e:
        print(f"❌ Offline migration failed: {e}")
        raise


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode with enhanced connection management.

    In this scenario we need to create an Engine and associate a
    connection with the context. Includes retry logic and better error handling.
    """
    try:
        print("🔄 Running migrations in ONLINE mode")
        
        # Get database URL with validation
        database_url = get_url()
        
        # Create engine configuration
        configuration = config.get_section(config.config_ini_section)
        configuration["sqlalchemy.url"] = database_url
        
        # Enhanced engine configuration for production stability
        engine_config = {
            'poolclass': pool.NullPool,
            'pool_pre_ping': True,  # Validate connections before use
            'pool_recycle': 300,    # Recycle connections every 5 minutes
            'connect_args': {
                'connect_timeout': 30,
                'application_name': 'alembic_migration'
            }
        }
        
        connectable = engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            **engine_config
        )

        print("🔗 Establishing database connection for migrations")
        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,  # Enable type comparison
                compare_server_default=True,  # Compare server defaults
                render_as_batch=True,  # Use batch mode for SQLite compatibility
            )

            with context.begin_transaction():
                context.run_migrations()
                
        print("✅ Online migrations completed successfully")
        
    except Exception as e:
        print(f"❌ Online migration failed: {e}")
        print("\n💡 Migration troubleshooting:")
        print("   1. Ensure database server is running and accessible")
        print("   2. Verify database credentials are correct")
        print("   3. Check network connectivity to database")
        print("   4. Review migration scripts for syntax errors")
        raise
    finally:
        # Ensure engine is properly disposed
        if 'connectable' in locals():
            connectable.dispose()


def main():
    """Main migration execution with environment detection."""
    try:
        env_type = detect_environment()
        print(f"🚀 Starting Alembic migrations in {env_type} environment")
        
        if context.is_offline_mode():
            run_migrations_offline()
        else:
            run_migrations_online()
            
    except Exception as e:
        print(f"❌ Migration execution failed: {e}")
        sys.exit(1)


# Execute migrations
if __name__ == '__main__':
    main()
else:
    # Support for direct alembic command execution
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        run_migrations_online()
