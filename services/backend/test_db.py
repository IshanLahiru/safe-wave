#!/usr/bin/env python3

import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, inspect, text
from app.core.config import settings
from app.core.database import Base, engine

async def test_database():
    """Test database connection and schema"""
    try:
        print("🔍 Checking database schema...")
        
        # Create inspector
        inspector = inspect(engine)
        
        # Get all table names
        tables = inspector.get_table_names()
        print(f"📋 Available tables: {tables}")
        
        # Check if audios table exists
        if 'audios' in tables:
            print("✅ audios table exists")
            
            # Get columns for audios table
            columns = inspector.get_columns('audios')
            print(f"📊 audios table columns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
                
            # Check if duration column exists
            duration_exists = any(col['name'] == 'duration' for col in columns)
            if duration_exists:
                print("✅ duration column exists in audios table")
            else:
                print("❌ duration column does not exist in audios table")
        else:
            print("❌ audios table does not exist")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_database())
