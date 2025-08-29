#!/usr/bin/env python3
"""
Script to create all database tables cleanly
"""

import asyncio
from sqlalchemy import text
from app.core.database import engine
from app.models.user import Base, User
from app.models.audio_analysis import AudioAnalysis
from app.core.database import SessionLocal
from app.utils.auth import get_password_hash
from datetime import datetime

def create_all_tables():
    """Create all tables"""
    print("🏗️  Creating all database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

def create_sample_data():
    """Create sample user data"""
    print("👤 Creating sample user data...")
    
    db = SessionLocal()
    try:
        # Check if sample user already exists
        existing_user = db.query(User).filter(User.email == "demo@example.com").first()
        if existing_user:
            print("ℹ️  Sample user already exists, skipping...")
            return
        
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
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(sample_user)
        db.commit()
        print("✅ Sample user created successfully!")
        print(f"   Email: demo@example.com")
        print(f"   Name: Demo User")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

def verify_tables():
    """Verify that all tables were created correctly"""
    print("\n🔍 Verifying table structure...")
    
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

def main():
    """Main execution function"""
    print("🌊 Safe Wave Database Setup")
    print("=" * 40)
    
    try:
        # Step 1: Create tables
        create_all_tables()
        
        # Step 2: Create sample data
        create_sample_data()
        
        # Step 3: Verify everything
        verify_tables()
        
        print("\n🎉 Database setup completed successfully!")
        print("🚀 You can now start your backend with: python start_backend.py")
        
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        print("Please check your database connection and try again.")

if __name__ == "__main__":
    main()
