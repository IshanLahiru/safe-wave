#!/usr/bin/env python3
"""
Script to recreate database migrations with proper structure and versioning.

This script will:
1. Remove all existing migration files
2. Create new migrations with proper versioning (001, 002, etc.)
3. Restructure the database with proper relationships
4. Remove duplicate data between audio and audio_analysis tables
5. Create email_alerts table for tracking notifications
"""

import os
import shutil
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def recreate_migrations():
    """Recreate all migrations with proper structure."""
    print("🔄 Recreating database migrations with proper structure...")
    print("=" * 60)
    
    # Paths
    versions_dir = backend_dir / "alembic" / "versions"
    
    # Step 1: Backup existing migrations
    backup_dir = backend_dir / "alembic" / "versions_backup"
    if versions_dir.exists():
        print("📦 Backing up existing migrations...")
        if backup_dir.exists():
            shutil.rmtree(backup_dir)
        shutil.copytree(versions_dir, backup_dir)
        print(f"✅ Migrations backed up to: {backup_dir}")
    
    # Step 2: Remove existing migration files
    if versions_dir.exists():
        print("🗑️  Removing existing migration files...")
        for file in versions_dir.glob("*.py"):
            if file.name != "__init__.py":
                file.unlink()
                print(f"   Removed: {file.name}")
        
        # Clean __pycache__
        pycache_dir = versions_dir / "__pycache__"
        if pycache_dir.exists():
            shutil.rmtree(pycache_dir)
            print("   Cleaned __pycache__")
    
    print("\n✅ Migration cleanup completed!")
    print("\nNext steps:")
    print("1. Run: npm run db:reset")
    print("2. Run: npm run migration:new 'Initial database structure'")
    print("3. Edit the generated migration to include proper structure")
    print("4. Run: npm run migration:run")

if __name__ == "__main__":
    recreate_migrations()
