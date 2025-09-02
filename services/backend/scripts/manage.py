#!/usr/bin/env python3
"""
Database Management Helper Script

This script provides utilities for managing the database lifecycle
including schema operations, migrations, and database recreation.

Usage:
    python scripts/manage.py <command> [options]

Commands:
    db-reset     - Drop schema, recreate schema, run migrations
    db-recreate  - Drop database, create database, run migrations
    migration-uncommit - Remove last migration revision
    migration-recreate - Delete last migration and regenerate it

Examples:
    python scripts/manage.py db-reset
    python scripts/manage.py db-recreate
    python scripts/manage.py migration-uncommit
    python scripts/manage.py migration-recreate "Updated user model"
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from typing import Optional


class DatabaseManager:
    """Database management utilities for Alembic and PostgreSQL operations."""
    
    def __init__(self):
        self.backend_dir = Path(__file__).parent.parent
        self.alembic_dir = self.backend_dir / "alembic"
        
    def run_command(self, command: list, description: str) -> bool:
        """Execute a shell command with error handling."""
        print(f"Running: {description}")
        print(f"Command: {' '.join(command)}")
        
        try:
            result = subprocess.run(
                command,
                cwd=self.backend_dir,
                check=True,
                capture_output=True,
                text=True
            )
            if result.stdout:
                print(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")
            if e.stderr:
                print(f"Error output: {e.stderr}")
            return False
    
    def get_database_url(self) -> Optional[str]:
        """Get database URL from environment or .env file."""
        # Try environment variable first
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            return db_url
            
        # Try reading from .env file
        env_file = self.backend_dir / '.env'
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        return line.split('=', 1)[1].strip().strip('"\'')
        
        return None
    
    def get_database_name(self) -> Optional[str]:
        """Extract database name from DATABASE_URL."""
        db_url = self.get_database_url()
        if not db_url:
            return None
            
        # Parse database name from URL
        # Format: postgresql://user:pass@host:port/dbname
        try:
            return db_url.split('/')[-1].split('?')[0]
        except:
            return None
    
    def db_reset(self) -> bool:
        """Drop schema, recreate schema, run migrations."""
        print("=" * 60)
        print("DATABASE SCHEMA RESET")
        print("=" * 60)
        print("This will:")
        print("1. Clear alembic version table")
        print("2. Drop all tables in the current schema")
        print("3. Recreate the schema structure")
        print("4. Run all migrations from scratch")
        print()

        # First try to clear the alembic_version table to fix corruption
        print("Clearing alembic version table...")
        try:
            # Use Python to clear the alembic_version table
            import sys
            import os
            sys.path.append(str(self.backend_dir))

            # Try to import and use the database connection
            try:
                from app.core.database import engine
                from sqlalchemy import text
                with engine.connect() as conn:
                    conn.execute(text("DELETE FROM alembic_version"))
                    conn.commit()
                print("Alembic version table cleared using Python.")
            except Exception as db_error:
                print(f"Warning: Could not clear alembic_version table via Python: {db_error}")
                # Try alternative approach - stamp to base
                try:
                    subprocess.run(
                        ["alembic", "stamp", "base"],
                        cwd=self.backend_dir,
                        check=True,
                        capture_output=True
                    )
                    print("Alembic version stamped to base.")
                except Exception as stamp_error:
                    print(f"Warning: Could not stamp alembic to base: {stamp_error}")
        except Exception as e:
            print(f"Warning: Could not clear alembic_version table: {e}")

        # Try to drop all tables using Alembic
        print("Attempting to drop all tables...")
        if not self.run_command(
            ["alembic", "downgrade", "base"],
            "Dropping all tables (downgrade to base)"
        ):
            print("Warning: Alembic downgrade failed, trying manual table drop...")
            # If alembic fails, try manual cleanup using Python
            try:
                from app.core.database import engine
                from sqlalchemy import text
                with engine.connect() as conn:
                    # Get all table names
                    result = conn.execute(text("""
                        SELECT tablename FROM pg_tables
                        WHERE schemaname = 'public'
                    """))
                    tables = [row[0] for row in result]

                    # Drop all tables
                    for table in tables:
                        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                    conn.commit()
                    print("Manual table cleanup completed using Python.")
            except Exception as e:
                print(f"Warning: Manual table cleanup failed: {e}")
                print("Continuing with migration attempt...")

        # Run all migrations
        if not self.run_command(
            ["alembic", "upgrade", "head"],
            "Running all migrations (upgrade to head)"
        ):
            return False

        print("Schema reset completed successfully!")
        return True
    
    def db_recreate(self) -> bool:
        """Drop database, create database, run migrations."""
        print("=" * 60)
        print("DATABASE RECREATION")
        print("=" * 60)
        print("This will:")
        print("1. Drop the entire database")
        print("2. Create a new empty database")
        print("3. Run all migrations from scratch")
        print()
        
        db_name = self.get_database_name()
        if not db_name:
            print("Error: Could not determine database name from DATABASE_URL")
            return False
        
        print(f"Target database: {db_name}")
        
        # Note: This requires psql to be available and proper permissions
        # Drop database
        if not self.run_command(
            ["psql", "-c", f"DROP DATABASE IF EXISTS {db_name};"],
            f"Dropping database '{db_name}'"
        ):
            print("Warning: Could not drop database (it may not exist)")
        
        # Create database
        if not self.run_command(
            ["psql", "-c", f"CREATE DATABASE {db_name};"],
            f"Creating database '{db_name}'"
        ):
            return False
        
        # Run all migrations
        if not self.run_command(
            ["alembic", "upgrade", "head"],
            "Running all migrations (upgrade to head)"
        ):
            return False
            
        print("Database recreation completed successfully!")
        return True
    
    def migration_uncommit(self) -> bool:
        """Remove the last migration revision."""
        print("=" * 60)
        print("UNCOMMIT LAST MIGRATION")
        print("=" * 60)
        print("This will remove the last migration revision file.")
        print("Use this if you want to delete a migration that hasn't been applied yet.")
        print()
        
        # Get current head
        try:
            result = subprocess.run(
                ["alembic", "current"],
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                check=True
            )
            current_head = result.stdout.strip()
            print(f"Current head: {current_head}")
        except subprocess.CalledProcessError:
            print("Error: Could not get current migration head")
            return False
        
        # Get migration history to find the last revision file
        try:
            result = subprocess.run(
                ["alembic", "history", "--verbose"],
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                check=True
            )
            
            # Find the latest revision file
            lines = result.stdout.split('\n')
            latest_revision = None
            for line in lines:
                if 'Rev:' in line and '->' in line:
                    # Extract revision ID
                    rev_part = line.split('Rev:')[1].split('->')[0].strip()
                    latest_revision = rev_part
                    break
            
            if not latest_revision:
                print("Error: Could not find latest revision")
                return False
                
            # Find and remove the revision file
            revision_files = list(self.alembic_dir.glob(f"versions/{latest_revision}*.py"))
            if not revision_files:
                print(f"Error: Could not find revision file for {latest_revision}")
                return False
                
            revision_file = revision_files[0]
            print(f"Removing revision file: {revision_file}")
            revision_file.unlink()
            
            print("Last migration revision removed successfully!")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"Error getting migration history: {e}")
            return False
    
    def migration_recreate(self, message: str) -> bool:
        """Delete last migration and regenerate it."""
        print("=" * 60)
        print("RECREATE LAST MIGRATION")
        print("=" * 60)
        print("This will:")
        print("1. Remove the last migration revision")
        print("2. Generate a new migration with your changes")
        print()
        
        # Remove last migration
        if not self.migration_uncommit():
            return False
        
        print("\nGenerating new migration...")
        
        # Generate new migration
        if not self.run_command(
            ["alembic", "revision", "--autogenerate", "-m", message],
            f"Generating new migration: {message}"
        ):
            return False
            
        print("Migration recreated successfully!")
        return True


def main():
    """Main entry point for the database management script."""
    parser = argparse.ArgumentParser(
        description="Database Management Helper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        'command',
        choices=['db-reset', 'db-recreate', 'migration-uncommit', 'migration-recreate'],
        help='Command to execute'
    )
    
    parser.add_argument(
        'message',
        nargs='?',
        help='Migration message (required for migration-recreate)'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.command == 'migration-recreate' and not args.message:
        print("Error: migration-recreate requires a message")
        parser.print_help()
        sys.exit(1)
    
    # Initialize database manager
    db_manager = DatabaseManager()
    
    # Execute command
    success = False
    if args.command == 'db-reset':
        success = db_manager.db_reset()
    elif args.command == 'db-recreate':
        success = db_manager.db_recreate()
    elif args.command == 'migration-uncommit':
        success = db_manager.migration_uncommit()
    elif args.command == 'migration-recreate':
        success = db_manager.migration_recreate(args.message)
    
    if success:
        print("\nOperation completed successfully!")
        sys.exit(0)
    else:
        print("\nOperation failed!")
        sys.exit(1)


if __name__ == '__main__':
    main()
