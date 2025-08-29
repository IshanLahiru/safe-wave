#!/usr/bin/env python3
"""
Simple database setup script for Safe Wave Backend
This bypasses Alembic and creates tables directly
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def setup_database():
    """Set up database tables directly"""
    try:
        print("🔧 Setting up Safe Wave database...")
        
        # Import database components
        from app.core.database import engine, Base
        from app.models.user import User
        from app.models.audio_analysis import AudioAnalysis
        
        print("✅ Models imported successfully")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        print("\n📋 Database setup complete!")
        print("   • Users table created")
        print("   • Audio analysis table created")
        print("   • All relationships established")
        
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        print("\n�� Troubleshooting:")
        print("   1. Check if PostgreSQL is running")
        print("   2. Verify your .env file has correct DATABASE_URL")
        print("   3. Make sure all packages are installed")
        return False

if __name__ == "__main__":
    success = setup_database()
    if not success:
        sys.exit(1)
