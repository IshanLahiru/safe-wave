#!/usr/bin/env python3
"""
Script to download Vosk speech recognition models
Run this script to download and set up Vosk models for offline transcription
"""

import os
import shutil
import sys
import zipfile
from pathlib import Path

import requests

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "app"))


def download_vosk_model(model_name: str = "vosk-model-small-en-us-0.15"):
    """Download a Vosk model"""

    # Model URLs
    model_urls = {
        "vosk-model-small-en-us-0.15": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip",
        "vosk-model-en-us-0.22": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
        "vosk-model-small-en-us-0.15-lgraph": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15-lgraph.zip",
    }

    if model_name not in model_urls:
        print(f"❌ Unknown model: {model_name}")
        print(f"Available models: {', '.join(model_urls.keys())}")
        return False

    url = model_urls[model_name]
    models_dir = Path("models")
    model_dir = models_dir / model_name
    zip_path = models_dir / f"{model_name}.zip"

    print(f"🚀 Downloading Vosk model: {model_name}")
    print(f"📁 Target directory: {model_dir}")
    print(f"🌐 Download URL: {url}")

    # Create models directory
    models_dir.mkdir(exist_ok=True)

    try:
        # Download the model
        print("⬇️  Downloading model file...")
        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get("content-length", 0))
        downloaded = 0

        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(
                            f"\r📥 Downloaded: {percent:.1f}% ({downloaded}/{total_size} bytes)",
                            end="",
                            flush=True,
                        )

        print(f"\n✅ Download completed: {zip_path}")

        # Extract the model
        print("📦 Extracting model...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(models_dir)

        print(f"✅ Model extracted to: {model_dir}")

        # Clean up zip file
        zip_path.unlink()
        print("🗑️  Cleaned up zip file")

        # Verify model structure
        if model_dir.exists():
            print(f"✅ Model ready at: {model_dir}")
            print(f"📊 Model size: {get_directory_size(model_dir)}")
            return True
        else:
            print(f"❌ Model extraction failed")
            return False

    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False


def get_directory_size(path: Path) -> str:
    """Get human-readable directory size"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            total_size += os.path.getsize(filepath)

    # Convert to human-readable format
    if total_size > 1024 * 1024 * 1024:  # GB
        return f"{total_size / (1024 * 1024 * 1024):.1f} GB"
    elif total_size > 1024 * 1024:  # MB
        return f"{total_size / (1024 * 1024):.1f} MB"
    else:  # KB
        return f"{total_size / 1024:.1f} KB"


def list_available_models():
    """List available Vosk models"""
    print("📚 Available Vosk Models:")
    print("=" * 50)

    models = {
        "vosk-model-small-en-us-0.15": {
            "size": "~42 MB",
            "description": "Small English model, fast, good for basic transcription",
            "recommended": "Yes (for development and testing)",
        },
        "vosk-model-en-us-0.22": {
            "size": "~1.6 GB",
            "description": "Medium English model, accurate, good balance",
            "recommended": "Yes (for production use)",
        },
        "vosk-model-small-en-us-0.15-lgraph": {
            "size": "~42 MB",
            "description": "Small English model with large vocabulary graph",
            "recommended": "Yes (for better vocabulary coverage)",
        },
    }

    for model_name, info in models.items():
        print(f"🔸 {model_name}")
        print(f"   Size: {info['size']}")
        print(f"   Description: {info['description']}")
        print(f"   Recommended: {info['recommended']}")
        print()


def main():
    """Main function"""
    print("🎤 Vosk Model Downloader")
    print("=" * 50)

    if len(sys.argv) > 1:
        model_name = sys.argv[1]
        success = download_vosk_model(model_name)
        if success:
            print(f"\n🎉 Model '{model_name}' downloaded successfully!")
            print("You can now use Vosk for offline audio transcription.")
        else:
            print(f"\n❌ Failed to download model '{model_name}'")
            sys.exit(1)
    else:
        print("Usage: python download_vosk_model.py [model_name]")
        print()
        list_available_models()
        print("Example: python download_vosk_model.py vosk-model-small-en-us-0.15")


if __name__ == "__main__":
    main()
