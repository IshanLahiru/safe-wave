#!/usr/bin/env python3
"""
Enhanced Cross-Platform Environment Setup Script for Safe Wave API
This script provides comprehensive .env file creation with platform-specific optimizations
and integration with Poetry and Turborepo workflows.
"""

import argparse
import os
import platform
import secrets
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class Colors:
    """ANSI color codes for cross-platform terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    
    @classmethod
    def disable_on_windows(cls):
        """Disable colors on Windows if not supported"""
        if platform.system() == "Windows" and not os.getenv("ANSICON"):
            for attr in dir(cls):
                if not attr.startswith('_'):
                    setattr(cls, attr, '')


class PlatformDetector:
    """Cross-platform system detection and utilities"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.architecture = platform.machine().lower()
        self.python_version = platform.python_version()
        
    def is_windows(self) -> bool:
        return self.system == "windows"
    
    def is_mac(self) -> bool:
        return self.system == "darwin"
    
    def is_linux(self) -> bool:
        return self.system == "linux"
    
    def is_apple_silicon(self) -> bool:
        return self.is_mac() and self.architecture in ["arm64", "aarch64"]
    
    def get_shell_info(self) -> Tuple[str, str]:
        """Get shell type and configuration file"""
        shell = os.getenv("SHELL", "unknown")
        if self.is_windows():
            return "powershell" if shutil.which("powershell") else "cmd", ""
        elif "zsh" in shell:
            return "zsh", "~/.zshrc"
        elif "bash" in shell:
            return "bash", "~/.bashrc"
        else:
            return "unknown", ""
    
    def get_platform_tips(self) -> List[str]:
        """Get platform-specific setup tips"""
        tips = []
        
        if self.is_windows():
            tips.extend([
                "Install Docker Desktop from docker.com",
                "Install Python from python.org or Microsoft Store",
                "Install Poetry: (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -",
                "Consider using WSL2 for better Docker performance",
                "Use Windows Terminal for better CLI experience"
            ])
        elif self.is_mac():
            tips.extend([
                "Install Docker Desktop or use Homebrew: brew install docker",
                "Install Poetry via Homebrew: brew install poetry",
                "For Apple Silicon, ensure Docker runs with proper emulation",
                "Consider using iTerm2 for better terminal experience"
            ])
        elif self.is_linux():
            tips.extend([
                "Install Docker via package manager or docker.com",
                "Install Poetry: curl -sSL https://install.python-poetry.org | python3 -",
                "Ensure user is in docker group: sudo usermod -aG docker $USER",
                "May need to install python3-venv package"
            ])
            
        return tips


class DependencyChecker:
    """Check and validate required dependencies"""
    
    def __init__(self, platform_detector: PlatformDetector):
        self.platform = platform_detector
        
    def check_command(self, command: str) -> Tuple[bool, str]:
        """Check if a command is available and get version"""
        try:
            if shutil.which(command):
                result = subprocess.run(
                    [command, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                version = result.stdout.strip().split('\n')[0] if result.stdout else "Unknown version"
                return True, version
            return False, "Not found"
        except Exception as e:
            return False, f"Error: {e}"
    
    def check_python_version(self) -> Tuple[bool, str]:
        """Check Python version compatibility"""
        version_tuple = tuple(map(int, self.platform.python_version.split('.')))
        if version_tuple >= (3, 9):
            return True, f"Python {self.platform.python_version} ✓"
        return False, f"Python {self.platform.python_version} (requires 3.9+)"
    
    def validate_environment(self) -> Dict[str, Tuple[bool, str]]:
        """Validate all required dependencies"""
        checks = {
            "Python": self.check_python_version(),
            "Poetry": self.check_command("poetry"),
            "Docker": self.check_command("docker"),
            "Git": self.check_command("git")
        }
        return checks


class EnvironmentGenerator:
    """Generate secure environment configuration"""
    
    def __init__(self):
        self.db_password = self._generate_secure_password()
        self.secret_key = self._generate_secret_key()
        
    def _generate_secret_key(self) -> str:
        """Generate a secure JWT secret key"""
        return secrets.token_urlsafe(32)
    
    def _generate_secure_password(self) -> str:
        """Generate a secure database password"""
        return secrets.token_urlsafe(16)
    
    def generate_env_content(self) -> str:
        """Generate complete .env file content"""
        return f"""# Database Configuration
POSTGRES_DB=safewave
POSTGRES_USER=safewave_user
POSTGRES_PASSWORD={self.db_password}
POSTGRES_PORT=5433
DATABASE_URL=postgresql://safewave_user:{self.db_password}@localhost:5433/safewave

# JWT Configuration
SECRET_KEY={self.secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Safe Wave API
API_PORT=9000

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
USE_LOCAL_MODELS=false
COST_OPTIMIZATION=true

# SMTP Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@safewave.com

# File Upload Configuration
UPLOAD_BASE_DIR=uploads
AUDIO_UPLOAD_DIR=uploads/audio
DOCUMENT_UPLOAD_DIR=uploads/documents
MAX_FILE_SIZE=104857600
ALLOWED_AUDIO_FORMATS=["mp3","wav","m4a","aac","ogg","flac"]
ALLOWED_DOCUMENT_FORMATS=["pdf","doc","docx","txt","rtf"]

# Audio Processing Configuration
AUDIO_CHUNK_SIZE=8192
ENABLE_AUDIO_STREAMING=true
ENABLE_TRANSCRIPTION=true
ENABLE_LLM_ANALYSIS=true
"""
    
    def create_env_file(self, force: bool = False) -> Tuple[bool, str]:
        """Create .env file with error handling"""
        try:
            env_path = Path(".env")
            
            if env_path.exists() and not force:
                return False, "File exists (use --force to overwrite)"
            
            env_content = self.generate_env_content()
            
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(env_content)
                
            return True, "Environment file created successfully"
            
        except PermissionError:
            return False, "Permission denied - check directory write permissions"
        except Exception as e:
            return False, f"Unexpected error: {e}"


def print_colored(message: str, color: str = Colors.WHITE):
    """Print colored message with fallback"""
    try:
        print(f"{color}{message}{Colors.RESET}")
    except:
        print(message)


def print_header(title: str):
    """Print formatted header"""
    separator = "=" * max(60, len(title) + 4)
    print_colored(f"\n{separator}", Colors.BLUE)
    print_colored(f"  {title}", Colors.BLUE)
    print_colored(f"{separator}", Colors.BLUE)


def print_step(message: str):
    """Print step message"""
    print_colored(f"\n🔧 {message}", Colors.CYAN)


def print_success(message: str):
    """Print success message"""
    print_colored(f"✅ {message}", Colors.GREEN)


def print_warning(message: str):
    """Print warning message"""
    print_colored(f"⚠️  {message}", Colors.YELLOW)


def print_error(message: str):
    """Print error message"""
    print_colored(f"❌ {message}", Colors.RED)


def print_info(message: str):
    """Print info message"""
    print_colored(f"ℹ️  {message}", Colors.CYAN)


def validate_dependencies(platform: PlatformDetector, skip_validation: bool = False) -> bool:
    """Validate system dependencies"""
    if skip_validation:
        print_warning("Skipping dependency validation")
        return True
        
    print_step("Validating system dependencies")
    
    checker = DependencyChecker(platform)
    results = checker.validate_environment()
    
    all_good = True
    for name, (available, info) in results.items():
        if available:
            print_success(f"{name}: {info}")
        else:
            print_error(f"{name}: {info}")
            all_good = False
    
    if not all_good:
        print_error("Missing required dependencies")
        print_info("Platform-specific installation tips:")
        for tip in platform.get_platform_tips():
            print(f"  • {tip}")
        
    return all_good


def main():
    """Enhanced main function with comprehensive options"""
    # Disable colors on unsupported Windows terminals
    Colors.disable_on_windows()
    
    parser = argparse.ArgumentParser(
        description="Enhanced Safe Wave API Environment Setup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/setup_env.py                    # Interactive setup
    python scripts/setup_env.py --force            # Force overwrite existing .env
    python scripts/setup_env.py --skip-validation  # Skip dependency checks
    python scripts/setup_env.py --quiet            # Minimal output

This script provides cross-platform environment setup with:
    • Platform detection and optimization
    • Secure random value generation
    • Dependency validation
    • Integration with Poetry workflows
    • Comprehensive error handling
        """
    )
    
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing .env file without prompting"
    )
    
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip dependency validation (faster but risky)"
    )
    
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Minimal output mode"
    )
    
    args = parser.parse_args()
    
    # Initialize platform detection
    platform = PlatformDetector()
    
    if not args.quiet:
        print_header("Safe Wave API Environment Setup")
        
        print_info(f"Platform: {platform.system.title()} {platform.architecture}")
        print_info(f"Python: {platform.python_version}")
        
        shell, config_file = platform.get_shell_info()
        print_info(f"Shell: {shell}")
        
    # Validate dependencies
    if not validate_dependencies(platform, args.skip_validation):
        if not args.force:
            print_error("Dependency validation failed. Use --force to continue anyway.")
            sys.exit(1)
        else:
            print_warning("Continuing despite dependency issues (force mode)")
    
    # Check existing .env file
    env_exists = Path(".env").exists()
    if env_exists and not args.force and not args.quiet:
        response = input("\n.env file already exists. Overwrite? (y/N): ")
        if response.lower() != "y":
            print_info("Setup cancelled")
            sys.exit(0)
    
    # Generate environment file
    print_step("Generating secure environment configuration")
    
    generator = EnvironmentGenerator()
    success, message = generator.create_env_file(force=args.force or env_exists)
    
    if success:
        print_success(message)
        
        if not args.quiet:
            print_warning("IMPORTANT: Update the following values in .env:")
            print("   • OPENAI_API_KEY: Set your actual OpenAI API key")
            print("   • SMTP_USERNAME: Set your email for notifications")
            print("   • SMTP_PASSWORD: Set your email app password")
            print("   • Database credentials (if needed)")
            
            print_info("\nNext steps:")
            print("   1. Review and update .env with your actual values")
            print("   2. Run: docker-compose up -d")
            print("   3. Run: poetry run python main.py")
            print("   4. Visit: http://localhost:9000/docs")
            
            print_info("\nPlatform-specific tips:")
            for tip in platform.get_platform_tips():
                print(f"   • {tip}")
                
        print_success("Environment setup completed successfully!")
        
    else:
        print_error(f"Setup failed: {message}")
        sys.exit(1)


if __name__ == "__main__":
    main()
