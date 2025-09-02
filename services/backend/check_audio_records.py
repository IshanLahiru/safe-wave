#!/usr/bin/env python3

import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker

from app.core.database import engine
from app.models.audio import Audio


async def check_audio_records():
    """Check existing audio records and their duration values"""
    try:
        print("Checking existing audio records...")

        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Get all audio records
        audios = db.query(Audio).all()
        print(f"Found {len(audios)} audio records")

        if audios:
            print("\nAudio records details:")
            for i, audio in enumerate(audios, 1):
                print(f"\nAudio {i}:")
                print(f"  - ID: {audio.id}")
                print(f"  - Filename: {audio.filename}")
                print(f"  - Duration: {audio.duration} seconds")
                print(f"  - File size: {audio.file_size} bytes")
                print(f"  - Transcription status: {audio.transcription_status}")
                print(f"  - Analysis status: {audio.analysis_status}")
                print(f"  - Created at: {audio.created_at}")

                # Check if file exists
                if audio.file_path and os.path.exists(audio.file_path):
                    print(f"  - File exists: YES")
                else:
                    print(f"  - File exists: NO (path: {audio.file_path})")
        else:
            print("No audio records found")

        db.close()

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(check_audio_records())
