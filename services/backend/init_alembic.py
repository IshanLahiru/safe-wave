#!/usr/bin/env python3
"""
Initialize Alembic for Safe Wave Backend
"""

import os
import sys
from pathlib import Path

def init_alembic():
    """Initialize Alembic configuration"""
    print("🔧 Initializing Alembic for Safe Wave Backend...")
    
    # Check if alembic directory exists
    alembic_dir = Path("alembic")
    if not alembic_dir.exists():
        print("❌ Alembic directory not found!")
        return False
    
    # Check if alembic.ini exists and has content
    alembic_ini = Path("alembic.ini")
    if not alembic_ini.exists() or alembic_ini.stat().st_size == 0:
        print("❌ alembic.ini is missing or empty!")
        return False
    
    # Check if env.py exists
    env_py = alembic_dir / "env.py"
    if not env_py.exists():
        print("❌ alembic/env.py not found!")
        return False
    
    # Check if versions directory exists
    versions_dir = alembic_dir / "versions"
    if not versions_dir.exists():
        print("❌ alembic/versions directory not found!")
        return False
    
    print("✅ Alembic configuration looks good!")
    print("📋 Next steps:")
    print("   1. Set up your database connection in .env file")
    print("   2. Run: alembic upgrade head")
    print("   3. Start your backend server")
    
    return True

if __name__ == "__main__":
    success = init_alembic()
    if not success:
        print("\n🔧 To fix Alembic issues:")
        print("   1. Make sure you're in the backend directory")
        print("   2. Check that all files exist")
        print("   3. Verify your .env configuration")
        sys.exit(1)
