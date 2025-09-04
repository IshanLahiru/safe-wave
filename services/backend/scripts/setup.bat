@echo off
REM Safe Wave API Setup Script - Windows Batch Wrapper
REM This is the Windows Command Prompt entry point for the Safe Wave backend setup process.

setlocal enabledelayedexpansion

REM Parse command line arguments for help
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

echo.
echo ==================================================================
echo   Safe Wave API Setup - Windows Batch Wrapper
echo ==================================================================
echo.

REM Detect system information
for /f "tokens=*" %%a in ('systeminfo ^| findstr /B /C:"OS Name"') do set "OS_INFO=%%a"
for /f "tokens=*" %%a in ('systeminfo ^| findstr /B /C:"System Type"') do set "ARCH_INFO=%%a"
echo [INFO] System: !OS_INFO!
echo [INFO] Architecture: !ARCH_INFO!

REM Check if we're in the right directory
if not exist "scripts\setup.py" (
    echo [ERROR] setup.py not found. Please run this script from the backend directory.
    echo [INFO] Expected location: services\backend\
    pause
    exit /b 1
)

REM Check for Python 3
set "PYTHON_CMD="
set "PYTHON_VERSION="

REM Try python3 first
python3 --version >nul 2>&1
if !errorlevel!==0 (
    for /f "tokens=2" %%a in ('python3 --version 2^>^&1') do set "PYTHON_VERSION=%%a"
    set "PYTHON_CMD=python3"
    goto python_found
)

REM Try python
python --version >nul 2>&1
if !errorlevel!==0 (
    for /f "tokens=2" %%a in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%a"
    
    REM Check if it's Python 3.x
    echo !PYTHON_VERSION! | findstr "^3\." >nul
    if !errorlevel!==0 (
        set "PYTHON_CMD=python"
        goto python_found
    ) else (
        echo [ERROR] Python !PYTHON_VERSION! is too old. Python 3.9+ is required.
        goto python_install_help
    )
)

REM Python not found
echo [ERROR] Python not found. Please install Python 3.9 or later.
goto python_install_help

:python_found
echo [SUCCESS] Python found: !PYTHON_VERSION!

REM Check Python version (require 3.9+)
for /f "tokens=1,2 delims=." %%a in ("!PYTHON_VERSION!") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
)

if !MAJOR! lss 3 (
    echo [ERROR] Python !PYTHON_VERSION! is too old. Python 3.9+ is required.
    goto python_install_help
)

if !MAJOR! equ 3 if !MINOR! lss 9 (
    echo [ERROR] Python !PYTHON_VERSION! is too old. Python 3.9+ is required.
    goto python_install_help
)

REM Check for Poetry
poetry --version >nul 2>&1
if !errorlevel!==0 (
    for /f "tokens=*" %%a in ('poetry --version 2^>^&1') do set "POETRY_VERSION=%%a"
    echo [SUCCESS] Poetry found: !POETRY_VERSION!
) else (
    echo [WARNING] Poetry not found. Please install Poetry manually.
    echo [INFO] Install Poetry with PowerShell:
    echo   ^(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing^).Content ^| python -
    echo [INFO] Or visit: https://python-poetry.org/docs/#installation
    echo.
    set /p "continue=Continue without Poetry? (y/N): "
    if /i not "!continue!"=="y" (
        echo [INFO] Setup cancelled. Please install Poetry and try again.
        pause
        exit /b 1
    )
)

REM Check for Git (optional)
git --version >nul 2>&1
if !errorlevel!==0 (
    for /f "tokens=3" %%a in ('git --version 2^>^&1') do set "GIT_VERSION=%%a"
    echo [SUCCESS] Git found: !GIT_VERSION!
) else (
    echo [WARNING] Git not found (optional but recommended)
)

REM Check for Docker (optional)
docker --version >nul 2>&1
if !errorlevel!==0 (
    for /f "tokens=3" %%a in ('docker --version 2^>^&1') do (
        set "DOCKER_VERSION=%%a"
        set "DOCKER_VERSION=!DOCKER_VERSION:,=!"
    )
    echo [SUCCESS] Docker found: !DOCKER_VERSION!
    
    REM Check if Docker is running
    docker info >nul 2>&1
    if !errorlevel!==0 (
        echo [SUCCESS] Docker is running
    ) else (
        echo [WARNING] Docker is installed but not running
        echo [INFO] Please start Docker Desktop and re-run this script for full functionality
    )
) else (
    echo [WARNING] Docker not found (required for database)
    echo [INFO] Please install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/
)

echo.
echo [INFO] Starting Python setup orchestrator...
echo.

REM Execute the Python setup script with all arguments
!PYTHON_CMD! scripts\setup.py %*
exit /b %errorlevel%

:python_install_help
echo.
echo [INFO] Install Python on Windows:
echo   • Download from: https://python.org/downloads/
echo   • Or use Microsoft Store: search for "Python"
echo   • Make sure to check "Add Python to PATH" during installation
echo.
echo [INFO] Alternative installation methods:
echo   • Chocolatey: choco install python
echo   • Winget: winget install Python.Python.3
echo.
pause
exit /b 1

:show_help
echo Safe Wave API Setup - Windows Batch Wrapper
echo.
echo Usage: setup.bat [OPTIONS]
echo.
echo Options:
echo   --quick         Quick setup mode (skip optional confirmations)
echo   --dev           Development mode (install dev dependencies)
echo   --production    Production mode (optimized installation)
echo   --docker-only   Setup Docker containers only
echo   --validate-only Run validation checks only (no changes)
echo   --force         Continue setup even if some steps fail
echo   --background    Start services in background (useful for CI)
echo   --help, -h      Show this help message
echo.
echo Examples:
echo   setup.bat                    # Interactive full setup
echo   setup.bat --quick            # Quick setup
echo   setup.bat --dev              # Development setup
echo   setup.bat --production       # Production setup
echo   setup.bat --validate-only    # Validation only
echo.
echo This wrapper automatically calls the Python setup orchestrator with
echo proper platform detection and error handling for Windows systems.
echo.
echo Windows-specific tips:
echo   • Use PowerShell for better experience (setup.ps1)
echo   • Run as Administrator if permission issues occur
echo   • Ensure Docker Desktop is installed and running
echo   • Windows Defender may need exclusions for development folders
echo.
pause
exit /b 0