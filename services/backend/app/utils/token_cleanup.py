#!/usr/bin/env python3
"""
Utility script for cleaning up expired blacklisted tokens
This can be run as a cron job or scheduled task
"""

import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.token_service import TokenService

async def cleanup_expired_tokens():
    """Clean up expired blacklisted tokens"""
    db = SessionLocal()
    try:
        count = TokenService.cleanup_expired_tokens(db)
        print(f"🧹 Cleaned up {count} expired tokens")
        return count
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(cleanup_expired_tokens())
