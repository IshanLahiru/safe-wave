#!/usr/bin/env python3
"""
Quick fix for corrupted alembic_version table.

This script manually clears the alembic_version table to fix
the "Can't locate revision" error.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def fix_alembic_version():
    """Fix corrupted alembic_version table."""
    try:
        # Import database connection
        from app.core.database import engine
        
        print("Connecting to database...")
        with engine.connect() as conn:
            # Clear the alembic_version table
            print("Clearing alembic_version table...")
            from sqlalchemy import text
            conn.execute(text("DELETE FROM alembic_version"))
            conn.commit()
            print("✅ Alembic version table cleared successfully!")
            
            # Optionally, you can stamp to a specific revision
            # Uncomment the next lines if you want to stamp to the latest revision
            # print("Stamping to latest revision...")
            # import subprocess
            # subprocess.run(["alembic", "stamp", "head"], cwd=backend_dir, check=True)
            # print("✅ Stamped to head successfully!")
            
    except ImportError as e:
        print(f"❌ Could not import database module: {e}")
        print("Make sure you're running this from the backend directory")
        return False
    except Exception as e:
        print(f"❌ Error fixing alembic version: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔧 Fixing corrupted alembic_version table...")
    print("=" * 50)
    
    if fix_alembic_version():
        print("\n✅ Fix completed successfully!")
        print("\nYou can now run:")
        print("  npm run migration:run")
        print("  npm run migration:status")
    else:
        print("\n❌ Fix failed!")
        sys.exit(1)
