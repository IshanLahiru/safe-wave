#!/usr/bin/env python3
"""
Start Safe Wave Backend Server
"""

import os
import sys

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def start_server():
    """Start the FastAPI server"""
    try:
        print("🚀 Starting Safe Wave Backend...")
        print("=" * 50)
        
        # Test imports
        from app.core.config import settings
        print("✅ Configuration loaded")
        
        from app.core.database import engine
        print("✅ Database connected")
        
        from main import app
        print("✅ FastAPI app loaded")
        
        print("\n🌊 Safe Wave Backend is ready!")
        print("📱 API will be available at: http://localhost:8000")
        print("📚 Documentation at: http://localhost:8000/docs")
        print("💚 Health check at: http://localhost:8000/health")
        print("\n🛑 Press Ctrl+C to stop the server")
        print("=" * 50)
        
        # Import and run uvicorn
        import uvicorn
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure virtual environment is activated")
        print("   2. Check if all packages are installed")
        print("   3. Verify database is running")
        return False

if __name__ == "__main__":
    start_server()
