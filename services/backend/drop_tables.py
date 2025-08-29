#!/usr/bin/env python3
"""
Script to drop all existing tables and recreate them cleanly
"""

import asyncio
from sqlalchemy import text
from app.core.database import engine
from app.models.user import Base
from app.models.audio_analysis import AudioAnalysis

async def drop_all_tables():
    """Drop all existing tables"""
    print("🗑️  Dropping all existing tables...")
    
    async with engine.begin() as conn:
        # Drop tables in correct order (due to foreign key constraints)
        await conn.execute(text("DROP TABLE IF EXISTS audio_analyses CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
        
        print("✅ All tables dropped successfully!")

def drop_tables_sync():
    """Synchronous version for direct execution"""
    with engine.begin() as conn:
        # Drop tables in correct order (due to foreign key constraints)
        conn.execute(text("DROP TABLE IF EXISTS audio_analyses CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
        
        print("✅ All tables dropped successfully!")

if __name__ == "__main__":
    print("🗑️  Safe Wave Database Cleanup")
    print("=" * 40)
    drop_tables_sync()
    print("\n🎯 Ready to recreate tables!")
