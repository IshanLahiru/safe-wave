#!/usr/bin/env python3
"""
Migration Management Helper Script

This script provides utilities for managing Alembic migrations
including creation, application, rollback, and history management.

Usage:
    python scripts/migration.py <command> [options]

Commands:
    new <message>     - Create a new migration with autogenerate
    run              - Apply all pending migrations (upgrade to head)
    rollback         - Rollback last migration (downgrade one step)
    history          - Show migration history
    current          - Show current migration head
    status           - Show migration status

Examples:
    python scripts/migration.py new "Add user table"
    python scripts/migration.py run
    python scripts/migration.py rollback
    python scripts/migration.py history
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from typing import Optional, List


class MigrationManager:
    """Migration management utilities for Alembic operations."""
    
    def __init__(self):
        self.backend_dir = Path(__file__).parent.parent
        self.alembic_dir = self.backend_dir / "alembic"
        
    def run_command(self, command: List[str], description: str) -> bool:
        """Execute a shell command with error handling."""
        print(f"Running: {description}")
        print(f"Command: {' '.join(command)}")
        print("-" * 40)
        
        try:
            result = subprocess.run(
                command,
                cwd=self.backend_dir,
                check=True,
                text=True
            )
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error: Command failed with exit code {e.returncode}")
            return False
    
    def run_command_with_output(self, command: List[str], description: str) -> Optional[str]:
        """Execute a shell command and return output."""
        print(f"Running: {description}")
        print(f"Command: {' '.join(command)}")
        print("-" * 40)
        
        try:
            result = subprocess.run(
                command,
                cwd=self.backend_dir,
                check=True,
                capture_output=True,
                text=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            print(f"Error: Command failed with exit code {e.returncode}")
            if e.stderr:
                print(f"Error output: {e.stderr}")
            return None
    
    def migration_new(self, message: str) -> bool:
        """Create a new migration with autogenerate."""
        print("=" * 60)
        print("CREATE NEW MIGRATION")
        print("=" * 60)
        print(f"Creating migration: {message}")
        print("This will:")
        print("1. Compare current database schema with models")
        print("2. Generate migration script with detected changes")
        print("3. Create new revision file in alembic/versions/")
        print()
        
        return self.run_command(
            ["alembic", "revision", "--autogenerate", "-m", message],
            f"Creating new migration: {message}"
        )
    
    def migration_run(self) -> bool:
        """Apply all pending migrations (upgrade to head)."""
        print("=" * 60)
        print("APPLY MIGRATIONS")
        print("=" * 60)
        print("This will:")
        print("1. Apply all pending migrations")
        print("2. Upgrade database to the latest schema")
        print("3. Update alembic_version table")
        print()
        
        return self.run_command(
            ["alembic", "upgrade", "head"],
            "Applying all pending migrations"
        )
    
    def migration_rollback(self) -> bool:
        """Rollback last migration (downgrade one step)."""
        print("=" * 60)
        print("ROLLBACK MIGRATION")
        print("=" * 60)
        print("This will:")
        print("1. Rollback the last applied migration")
        print("2. Downgrade database by one migration step")
        print("3. Update alembic_version table")
        print()
        
        # Get current head first
        current = self.run_command_with_output(
            ["alembic", "current"],
            "Getting current migration head"
        )
        
        if current:
            print(f"Current head: {current.strip()}")
        
        return self.run_command(
            ["alembic", "downgrade", "-1"],
            "Rolling back last migration"
        )
    
    def migration_history(self) -> bool:
        """Show migration history."""
        print("=" * 60)
        print("MIGRATION HISTORY")
        print("=" * 60)
        print("Showing all migrations in chronological order:")
        print()
        
        return self.run_command(
            ["alembic", "history", "--verbose"],
            "Displaying migration history"
        )
    
    def migration_current(self) -> bool:
        """Show current migration head."""
        print("=" * 60)
        print("CURRENT MIGRATION")
        print("=" * 60)
        print("Current database migration head:")
        print()
        
        return self.run_command(
            ["alembic", "current", "--verbose"],
            "Displaying current migration head"
        )
    
    def migration_status(self) -> bool:
        """Show migration status."""
        print("=" * 60)
        print("MIGRATION STATUS")
        print("=" * 60)
        
        # Get current head
        print("Current migration head:")
        current_output = self.run_command_with_output(
            ["alembic", "current"],
            "Getting current head"
        )
        
        if current_output:
            current_head = current_output.strip()
            print(f"  {current_head}")
        else:
            print("  No migrations applied")
        
        print()
        
        # Get pending migrations
        print("Checking for pending migrations...")
        
        # Show heads
        heads_output = self.run_command_with_output(
            ["alembic", "heads"],
            "Getting available heads"
        )
        
        if heads_output:
            available_head = heads_output.strip()
            print(f"Latest available migration: {available_head}")
            
            if current_output and current_output.strip() == available_head:
                print("Status: Database is up to date")
            else:
                print("Status: Pending migrations available")
        
        print()
        
        # Show recent history
        print("Recent migration history:")
        return self.run_command(
            ["alembic", "history", "--verbose"],
            "Showing recent migrations"
        )


def main():
    """Main entry point for the migration management script."""
    parser = argparse.ArgumentParser(
        description="Migration Management Helper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        'command',
        choices=['new', 'run', 'rollback', 'history', 'current', 'status'],
        help='Command to execute'
    )
    
    parser.add_argument(
        'message',
        nargs='?',
        help='Migration message (required for new command)'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.command == 'new' and not args.message:
        print("Error: 'new' command requires a migration message")
        parser.print_help()
        sys.exit(1)
    
    # Initialize migration manager
    migration_manager = MigrationManager()
    
    # Execute command
    success = False
    if args.command == 'new':
        success = migration_manager.migration_new(args.message)
    elif args.command == 'run':
        success = migration_manager.migration_run()
    elif args.command == 'rollback':
        success = migration_manager.migration_rollback()
    elif args.command == 'history':
        success = migration_manager.migration_history()
    elif args.command == 'current':
        success = migration_manager.migration_current()
    elif args.command == 'status':
        success = migration_manager.migration_status()
    
    if success:
        print("\nOperation completed successfully!")
        sys.exit(0)
    else:
        print("\nOperation failed!")
        sys.exit(1)


if __name__ == '__main__':
    main()
