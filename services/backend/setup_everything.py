#!/usr/bin/env python3
"""
Complete Safe Wave Backend Setup Script
This script will:
1. Drop all existing tables
2. Create fresh tables
3. Add sample data
4. Start the backend server
"""

import os
import sys
import subprocess
import time
from sqlalchemy import text
from app.core.database import engine
from app.models.user import Base, User
from app.models.audio_analysis import AudioAnalysis
from app.core.database import SessionLocal
from datetime import datetime, timezone

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🚀 {title}")
    print("=" * 60)

def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n📋 Step {step_num}: {description}")
    print("-" * 40)

def drop_all_tables():
    """Step 1: Drop all existing tables"""
    print_step(1, "Dropping all existing tables...")
    
    try:
        with engine.begin() as conn:
            # Drop tables in correct order (due to foreign key constraints)
            conn.execute(text("DROP TABLE IF EXISTS audio_analyses CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
            
        print("✅ All tables dropped successfully!")
        return True
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        return False

def create_all_tables():
    """Step 2: Create all tables fresh"""
    print_step(2, "Creating all database tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def create_sample_data():
    """Step 3: Create sample user data"""
    print_step(3, "Creating sample user data...")
    
    db = SessionLocal()
    try:
        # Create sample user
        sample_user = User(
            email="demo@example.com",
            name="Demo User",
            role="user",
            is_onboarding_complete=False,
            emergency_contact_name="John Doe",
            emergency_contact_email="john@example.com",
            emergency_contact_relationship="Family member",
            care_person_email="care@example.com",
            preferences={
                "checkinFrequency": "daily",
                "darkMode": False,
                "language": "en"
            },
            onboarding_answers={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(sample_user)
        db.commit()
        print("✅ Sample user created successfully!")
        print(f"   📧 Email: demo@example.com")
        print(f"   👤 Name: Demo User")
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_tables():
    """Step 4: Verify table structure"""
    print_step(4, "Verifying table structure...")
    
    try:
        with engine.connect() as conn:
            # Check users table
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position
                """))
            
            print("\n📋 USERS table columns:")
            for row in result:
                nullable = "NULL" if row.is_nullable == "YES" else "NOT NULL"
                print(f"   - {row.column_name}: {row.data_type} ({nullable})")
            
            # Check audio_analyses table
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'audio_analyses' 
                ORDER BY ordinal_position
                """))
            
            print("\n📋 AUDIO_ANALYSES table columns:")
            for row in result:
                nullable = "NULL" if row.is_nullable == "YES" else "NOT NULL"
                print(f"   - {row.column_name}: {row.data_type} ({nullable})")
            
            # Count records
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"\n📊 Current user count: {user_count}")
            
        print("✅ Table verification completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying tables: {e}")
        return False

def start_backend():
    """Step 5: Start the backend server"""
    print_step(5, "Starting the backend server...")
    
    print("🌊 Starting Safe Wave Backend...")
    print("📱 API will be available at: http://localhost:8000")
    print("📚 Documentation at: http://localhost:8000/docs")
    print("\n⏹️  Press Ctrl+C to stop the server")
    print("-" * 40)
    
    try:
        # Start the backend server
        subprocess.run([sys.executable, "start_backend.py"])
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")

def main():
    """Main execution function"""
    print_header("Safe Wave Complete Backend Setup")
    
    print("This script will set up your entire backend from scratch!")
    print("Make sure your PostgreSQL database is running.")
    
    # Check if database is accessible
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Cannot connect to database: {e}")
        print("Please make sure PostgreSQL is running and accessible.")
        return
    
    # Execute all steps
    steps = [
        ("Dropping tables", drop_all_tables),
        ("Creating tables", create_all_tables),
        ("Adding sample data", create_sample_data),
        ("Verifying setup", verify_tables)
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Setup failed at: {step_name}")
            print("Please check the error and try again.")
            return
    
    print_header("Setup Completed Successfully!")
    print("🎉 Your Safe Wave backend is ready!")
    print("🚀 Starting the server now...")
    
    # Start the backend
    start_backend()

if __name__ == "__main__":
    main()
