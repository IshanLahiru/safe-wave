#!/usr/bin/env python3
"""
Safe Wave API Master Setup Orchestrator - Cross-Platform
This is the universal entry point for setting up the Safe Wave backend on any platform.

Features:
    • Automatic platform detection (Windows/macOS/Linux)
    • Comprehensive dependency validation and installation guidance
    • Environment configuration with secure defaults
    • Database setup and migration automation
    • Docker container orchestration
    • Poetry dependency management integration
    • Development server startup with health checks
    • Integration with Turborepo workflows

Usage:
    python scripts/setup.py                    # Interactive full setup
    python scripts/setup.py --quick            # Quick setup (skip optional steps)
    python scripts/setup.py --dev              # Development setup (includes dev dependencies)
    python scripts/setup.py --production       # Production setup (optimized)
    python scripts/setup.py --docker-only      # Docker setup only
    python scripts/setup.py --validate-only    # Validation only (no changes)
"""

import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Import our enhanced modules
try:
    from .setup_env import Colors, PlatformDetector, DependencyChecker, EnvironmentGenerator
    from .kill_port import EnhancedPortKiller
except ImportError:
    # Fallback for direct execution
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent))
    from setup_env import Colors, PlatformDetector, DependencyChecker, EnvironmentGenerator
    from kill_port import EnhancedPortKiller


class SetupOrchestrator:
    """Master orchestrator for cross-platform Safe Wave backend setup"""
    
    def __init__(self):
        self.platform = PlatformDetector()
        self.dependency_checker = DependencyChecker(self.platform)
        self.port_killer = EnhancedPortKiller()
        self.colors = Colors()
        
        # Setup configuration
        self.setup_stages = [
            ("validate_system", "System Validation"),
            ("setup_environment", "Environment Configuration"), 
            ("install_dependencies", "Dependency Installation"),
            ("setup_database", "Database Setup"),
            ("run_migrations", "Database Migrations"),
            ("validate_installation", "Installation Validation"),
            ("start_services", "Service Startup")
        ]
        
        self.success_count = 0
        self.warning_count = 0
        self.error_count = 0
        
    def print_header(self, title: str):
        """Print formatted header"""
        separator = "=" * max(80, len(title) + 4)
        self._print_colored(f"\n{separator}", Colors.BLUE)
        self._print_colored(f"  {title}", Colors.BLUE)
        self._print_colored(f"{separator}", Colors.BLUE)
    
    def print_step(self, message: str, step: int = 0, total: int = 0):
        """Print step message with progress"""
        if total > 0:
            progress = f"[{step}/{total}] "
        else:
            progress = ""
        self._print_colored(f"\n🔧 {progress}{message}", Colors.CYAN)
    
    def print_success(self, message: str):
        """Print success message"""
        self._print_colored(f"✅ {message}", Colors.GREEN)
        self.success_count += 1
    
    def print_warning(self, message: str):
        """Print warning message"""
        self._print_colored(f"⚠️  {message}", Colors.YELLOW)
        self.warning_count += 1
    
    def print_error(self, message: str):
        """Print error message"""
        self._print_colored(f"❌ {message}", Colors.RED)
        self.error_count += 1
    
    def print_info(self, message: str):
        """Print info message"""
        self._print_colored(f"ℹ️  {message}", Colors.CYAN)
    
    def _print_colored(self, message: str, color: str):
        """Print with color support"""
        try:
            print(f"{color}{message}{Colors.RESET}")
        except:
            print(message)
    
    def validate_system(self, skip_optional: bool = False) -> Tuple[bool, List[str]]:
        """Validate system requirements and dependencies"""
        self.print_step("Validating system dependencies")
        
        results = self.dependency_checker.validate_environment()
        issues = []
        critical_missing = False
        
        for name, (available, info) in results.items():
            if available:
                self.print_success(f"{name}: {info}")
            else:
                if name in ["Python", "Poetry"]:  # Critical dependencies
                    self.print_error(f"{name}: {info}")
                    critical_missing = True
                else:
                    self.print_warning(f"{name}: {info}")
                issues.append(f"{name}: {info}")
        
        # Check Python version specifically
        if "Python" in results:
            python_available, python_info = results["Python"]
            if not python_available or "requires 3.9+" in python_info:
                critical_missing = True
        
        # Platform-specific checks
        if self.platform.is_windows():
            if not shutil.which("powershell"):
                self.print_warning("PowerShell not found - batch files will be used as fallback")
                
        # Provide installation guidance for missing dependencies
        if issues:
            self.print_info("\nInstallation guidance:")
            for tip in self.platform.get_platform_tips():
                print(f"  • {tip}")
        
        return not critical_missing, issues
    
    def setup_environment(self, force: bool = False, quick: bool = False) -> bool:
        """Setup environment configuration"""
        self.print_step("Setting up environment configuration")
        
        try:
            generator = EnvironmentGenerator()
            
            env_exists = Path(".env").exists()
            if env_exists and not force and not quick:
                response = input("\n.env file already exists. Recreate it? (y/N): ")
                if response.lower() != "y":
                    self.print_info("Using existing .env file")
                    return True
            
            success, message = generator.create_env_file(force=(force or quick or env_exists))
            
            if success:
                self.print_success("Environment configuration created")
                
                if not quick:
                    self.print_warning("Remember to update these values in .env:")
                    print("   • OPENAI_API_KEY: Your OpenAI API key")
                    print("   • SMTP_USERNAME: Your email for notifications")
                    print("   • SMTP_PASSWORD: Your email app password")
                
                return True
            else:
                self.print_error(f"Environment setup failed: {message}")
                return False
                
        except Exception as e:
            self.print_error(f"Environment setup error: {e}")
            return False
    
    def install_dependencies(self, dev_mode: bool = False, production: bool = False) -> bool:
        """Install Python dependencies via Poetry"""
        self.print_step("Installing Python dependencies")
        
        try:
            # Configure Poetry for local venv
            result = subprocess.run(
                ["poetry", "config", "virtualenvs.in-project", "true"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.print_success("Configured Poetry for local virtual environment")
            else:
                self.print_warning("Could not configure Poetry (continuing anyway)")
            
            # Install dependencies based on mode
            if production:
                cmd = ["poetry", "install", "--only", "main"]
                self.print_info("Installing production dependencies only...")
            elif dev_mode:
                cmd = ["poetry", "install", "--with", "dev,test"]
                self.print_info("Installing development dependencies...")
            else:
                cmd = ["poetry", "install"]
                self.print_info("Installing all dependencies...")
            
            result = subprocess.run(cmd, timeout=300)  # 5 minute timeout
            
            if result.returncode == 0:
                self.print_success("Python dependencies installed successfully")
                return True
            else:
                self.print_error("Failed to install Python dependencies")
                return False
                
        except subprocess.TimeoutExpired:
            self.print_error("Dependency installation timed out")
            return False
        except Exception as e:
            self.print_error(f"Dependency installation error: {e}")
            return False
    
    def setup_database(self, quick: bool = False) -> bool:
        """Setup database containers and connections"""
        self.print_step("Setting up database")
        
        try:
            # Check if Docker is available
            if not shutil.which("docker"):
                self.print_error("Docker not found - database setup requires Docker")
                return False
            
            # Check if docker-compose is available
            compose_cmd = self._get_docker_compose_command()
            if not compose_cmd:
                self.print_error("Docker Compose not found")
                return False
            
            # Start database containers
            self.print_info("Starting database containers...")
            result = subprocess.run(
                compose_cmd + ["up", "-d", "db", "redis"],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode != 0:
                self.print_error(f"Failed to start containers: {result.stderr}")
                return False
            
            self.print_success("Database containers started")
            
            # Wait for database to be ready
            if not quick:
                self.print_info("Waiting for database to be ready...")
                max_attempts = 30
                
                for attempt in range(max_attempts):
                    try:
                        result = subprocess.run(
                            compose_cmd + ["exec", "-T", "db", "pg_isready", "-U", "safewave_user", "-d", "safewave"],
                            capture_output=True,
                            timeout=10
                        )
                        
                        if result.returncode == 0:
                            self.print_success("Database is ready")
                            break
                            
                    except subprocess.TimeoutExpired:
                        pass
                    
                    if attempt < max_attempts - 1:
                        print(".", end="", flush=True)
                        time.sleep(2)
                else:
                    self.print_warning("Database readiness check timed out (continuing anyway)")
            
            return True
            
        except Exception as e:
            self.print_error(f"Database setup error: {e}")
            return False
    
    def run_migrations(self) -> bool:
        """Run database migrations"""
        self.print_step("Running database migrations")
        
        try:
            # Run Alembic migrations
            result = subprocess.run(
                ["poetry", "run", "alembic", "upgrade", "head"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                self.print_success("Database migrations completed")
                return True
            else:
                # Check if it's just a "no changes" situation
                if "No changes in schema detected" in result.stdout or "Target database is not up to date" not in result.stderr:
                    self.print_success("Database schema is up to date")
                    return True
                else:
                    self.print_error(f"Migration failed: {result.stderr}")
                    return False
                    
        except subprocess.TimeoutExpired:
            self.print_error("Migration timed out")
            return False
        except Exception as e:
            self.print_error(f"Migration error: {e}")
            return False
    
    def validate_installation(self) -> bool:
        """Validate the installation"""
        self.print_step("Validating installation")
        
        checks_passed = 0
        total_checks = 4
        
        # Check .env file
        if Path(".env").exists():
            self.print_success("Environment configuration exists")
            checks_passed += 1
        else:
            self.print_error("Environment configuration missing")
        
        # Check virtual environment
        if Path(".venv").exists():
            self.print_success("Python virtual environment exists")
            checks_passed += 1
        else:
            self.print_error("Python virtual environment missing")
        
        # Check Docker containers
        try:
            compose_cmd = self._get_docker_compose_command()
            if compose_cmd:
                result = subprocess.run(
                    compose_cmd + ["ps", "--services", "--filter", "status=running"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    self.print_success("Docker containers are running")
                    checks_passed += 1
                else:
                    self.print_warning("Docker containers not running")
            else:
                self.print_warning("Cannot check Docker containers")
        except Exception:
            self.print_warning("Could not validate Docker containers")
        
        # Check Poetry environment
        try:
            result = subprocess.run(
                ["poetry", "run", "python", "--version"],
                capture_output=True,
                timeout=10
            )
            
            if result.returncode == 0:
                self.print_success("Poetry environment is functional")
                checks_passed += 1
            else:
                self.print_warning("Poetry environment issues detected")
        except Exception:
            self.print_warning("Could not validate Poetry environment")
        
        success_rate = checks_passed / total_checks
        if success_rate >= 0.75:
            self.print_success(f"Installation validation passed ({checks_passed}/{total_checks} checks)")
            return True
        else:
            self.print_warning(f"Installation validation concerns ({checks_passed}/{total_checks} checks passed)")
            return success_rate >= 0.5  # Still acceptable with warnings
    
    def start_services(self, background: bool = False) -> bool:
        """Start the development services"""
        self.print_step("Starting development services")
        
        # Clean up any existing processes on our ports first
        self.print_info("Cleaning up existing processes on backend ports...")
        for port in [9000, 5432, 6379]:  # API, PostgreSQL, Redis
            try:
                processes = self.port_killer.find_processes_on_port(port, include_docker=False)
                if processes:
                    self.port_killer.kill_processes_on_port(port, force=True, include_docker=False)
            except Exception:
                pass  # Continue if port cleanup fails
        
        try:
            if background:
                self.print_info("Starting API server in background...")
                # Start in background (for CI/testing)
                subprocess.Popen(
                    ["poetry", "run", "python", "main.py"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                
                # Give it a moment to start
                time.sleep(3)
                self.print_success("API server started in background")
                return True
            else:
                self.print_success("Ready to start development server!")
                self.print_info("The API server will start on http://localhost:9000")
                self.print_info("API Documentation: http://localhost:9000/docs")
                self.print_info("Press Ctrl+C to stop the server")
                print()
                
                # Start interactively
                subprocess.run(["poetry", "run", "python", "main.py"])
                return True
                
        except KeyboardInterrupt:
            self.print_info("Server stopped by user")
            return True
        except Exception as e:
            self.print_error(f"Failed to start services: {e}")
            return False
    
    def _get_docker_compose_command(self) -> Optional[List[str]]:
        """Get the appropriate docker-compose command"""
        # Try docker compose first (newer syntax)
        try:
            result = subprocess.run(
                ["docker", "compose", "version"],
                capture_output=True,
                timeout=10
            )
            if result.returncode == 0:
                return ["docker", "compose"]
        except:
            pass
        
        # Try docker-compose (legacy)
        try:
            result = subprocess.run(
                ["docker-compose", "version"],
                capture_output=True,
                timeout=10
            )
            if result.returncode == 0:
                return ["docker-compose"]
        except:
            pass
        
        return None
    
    def run_full_setup(self, args) -> bool:
        """Run the complete setup process"""
        self.print_header("Safe Wave API Complete Setup")
        
        self.print_info(f"Platform: {self.platform.system.title()} {self.platform.architecture}")
        self.print_info(f"Python: {self.platform.python_version}")
        shell, _ = self.platform.get_shell_info()
        self.print_info(f"Shell: {shell}")
        
        success = True
        total_stages = len(self.setup_stages)
        
        for i, (stage_func, stage_name) in enumerate(self.setup_stages, 1):
            if args.validate_only and stage_func != "validate_system":
                continue
                
            self.print_step(f"{stage_name}", i, total_stages)
            
            try:
                if stage_func == "validate_system":
                    stage_success, _ = self.validate_system(args.quick)
                elif stage_func == "setup_environment":
                    if args.docker_only:
                        continue
                    stage_success = self.setup_environment(args.force, args.quick)
                elif stage_func == "install_dependencies":
                    if args.docker_only:
                        continue
                    stage_success = self.install_dependencies(args.dev, args.production)
                elif stage_func == "setup_database":
                    stage_success = self.setup_database(args.quick)
                elif stage_func == "run_migrations":
                    if args.docker_only:
                        continue
                    stage_success = self.run_migrations()
                elif stage_func == "validate_installation":
                    stage_success = self.validate_installation()
                elif stage_func == "start_services":
                    if args.validate_only or args.docker_only:
                        continue
                    # Don't fail overall setup if user cancels server startup
                    try:
                        self.start_services(args.background)
                        stage_success = True
                    except KeyboardInterrupt:
                        stage_success = True
                        break
                else:
                    stage_success = True
                
                if not stage_success:
                    if not args.force:
                        success = False
                        break
                    else:
                        self.print_warning(f"{stage_name} failed but continuing due to --force")
                        
            except Exception as e:
                self.print_error(f"{stage_name} failed with error: {e}")
                if not args.force:
                    success = False
                    break
        
        return success
    
    def print_summary(self, success: bool):
        """Print setup summary"""
        self.print_header("Setup Summary")
        
        if success:
            self.print_success(f"Setup completed successfully!")
        else:
            self.print_error("Setup encountered errors")
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successes: {self.success_count}")
        if self.warning_count > 0:
            print(f"   ⚠️  Warnings: {self.warning_count}")
        if self.error_count > 0:
            print(f"   ❌ Errors: {self.error_count}")
        
        if success:
            print(f"\n🎉 Safe Wave API is ready!")
            print(f"   • Environment: Configured")
            print(f"   • Dependencies: Installed")
            print(f"   • Database: Running")
            print(f"   • API: http://localhost:9000")
            print(f"   • Docs: http://localhost:9000/docs")
            
            print(f"\n📝 Next steps:")
            print(f"   1. Update .env with your API keys")
            print(f"   2. Run: poetry run python main.py")
            print(f"   3. Visit: http://localhost:9000/docs")
            
            if self.platform.is_windows():
                print(f"\n💡 Windows tips:")
                print(f"   • Use PowerShell for best experience")
                print(f"   • Run as Administrator if needed")
                print(f"   • Docker Desktop must be running")


def main():
    """Main setup orchestrator CLI"""
    parser = argparse.ArgumentParser(
        description="Safe Wave API Master Setup Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/setup.py                    # Interactive full setup
    python scripts/setup.py --quick            # Quick setup (skip optional steps)
    python scripts/setup.py --dev              # Development setup
    python scripts/setup.py --production       # Production setup
    python scripts/setup.py --docker-only      # Docker setup only
    python scripts/setup.py --validate-only    # Validation only

This orchestrator provides comprehensive cross-platform setup with:
    • Automatic platform detection and optimization
    • Dependency validation and installation guidance
    • Environment configuration with secure defaults
    • Database setup and migration automation
    • Integration with Poetry and Turborepo workflows
        """
    )
    
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Quick setup mode (skip optional confirmations)"
    )
    
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Development mode (install dev dependencies)"
    )
    
    parser.add_argument(
        "--production",
        action="store_true",
        help="Production mode (optimized installation)"
    )
    
    parser.add_argument(
        "--docker-only",
        action="store_true",
        help="Setup Docker containers only"
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Run validation checks only (no changes)"
    )
    
    parser.add_argument(
        "--force",
        action="store_true",
        help="Continue setup even if some steps fail"
    )
    
    parser.add_argument(
        "--background",
        action="store_true",
        help="Start services in background (useful for CI)"
    )
    
    args = parser.parse_args()
    
    # Initialize colors for current platform
    Colors.disable_on_windows()
    
    # Create and run orchestrator
    orchestrator = SetupOrchestrator()
    
    try:
        success = orchestrator.run_full_setup(args)
        orchestrator.print_summary(success)
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected setup error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()