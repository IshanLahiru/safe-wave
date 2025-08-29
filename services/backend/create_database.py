#!/usr/bin/env python3
"""
Script to create the safewave database if it doesn't exist
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Create the safewave database"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host='localhost',
            user='postgres',
            password='mysecretpassword',
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='safewave'")
        exists = cursor.fetchone()
        
        if exists:
            print("✅ Database 'safewave' already exists!")
        else:
            # Create the database
            cursor.execute("CREATE DATABASE safewave")
            print("✅ Database 'safewave' created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

if __name__ == "__main__":
    print("🗄️  Creating Safe Wave Database")
    print("=" * 40)
    
    if create_database():
        print("\n🎯 Database is ready!")
        print("🚀 You can now run: python setup_everything.py")
    else:
        print("\n❌ Failed to create database")
        print("Please check your PostgreSQL connection.")
