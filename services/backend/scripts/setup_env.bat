@echo off
REM Safe Wave API Environment Setup Script - Batch File
REM This script helps you create a .env file with secure values on Windows.

setlocal enabledelayedexpansion

set "FORCE_MODE=0"

REM Parse command line arguments
:parse_args
if "%1"=="/?" goto show_help
if "%1"=="--help" goto show_help
if "%1"=="-help" goto show_help
if "%1"=="--force" set "FORCE_MODE=1"
if "%1"=="-force" set "FORCE_MODE=1"
if "%1"=="-f" set "FORCE_MODE=1"
shift
if not "%1"=="" goto parse_args

echo.
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo 🚀 Safe Wave API Environment Setup
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo.

REM Check if .env already exists
if exist ".env" (
    if "%FORCE_MODE%"=="1" (
        echo ⚠️  Force mode: Overwriting existing .env file
        goto generate_env
    )
    
    set /p "overwrite=⚠️  .env already exists. Overwrite? (y/N): "
    if /i "!overwrite!"=="y" (
        goto generate_env
    ) else (
        echo ❌ Setup cancelled
        goto end
    )
)

:generate_env
echo 🔐 Generating secure random values...

REM Generate random values using PowerShell (more secure than pure batch)
for /f "delims=" %%i in ('powershell -command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N').Substring(0, 32)"') do set "SECRET_KEY=%%i"
for /f "delims=" %%i in ('powershell -command "[System.Guid]::NewGuid().ToString('N').Substring(0, 16)"') do set "DB_PASSWORD=%%i"

if "!SECRET_KEY!"=="" (
    echo ⚠️  PowerShell not available, using fallback method...
    set "SECRET_KEY=%RANDOM%%RANDOM%%RANDOM%%RANDOM%"
    set "DB_PASSWORD=%RANDOM%%RANDOM%"
)

echo ✅ Secure values generated successfully

REM Create .env file
echo # Database Configuration > .env
echo POSTGRES_DB=safewave >> .env
echo POSTGRES_USER=safewave_user >> .env
echo POSTGRES_PASSWORD=!DB_PASSWORD! >> .env
echo POSTGRES_PORT=5433 >> .env
echo DATABASE_URL=postgresql://safewave_user:!DB_PASSWORD!@localhost:5433/safewave >> .env
echo. >> .env
echo # JWT Configuration >> .env
echo SECRET_KEY=!SECRET_KEY! >> .env
echo ALGORITHM=HS256 >> .env
echo ACCESS_TOKEN_EXPIRE_MINUTES=15 >> .env
echo REFRESH_TOKEN_EXPIRE_DAYS=7 >> .env
echo. >> .env
echo # API Configuration >> .env
echo API_V1_STR=/api/v1 >> .env
echo PROJECT_NAME=Safe Wave API >> .env
echo API_PORT=9000 >> .env
echo. >> .env
echo # OpenAI Configuration >> .env
echo OPENAI_API_KEY=your-openai-api-key-here >> .env
echo USE_LOCAL_MODELS=false >> .env
echo COST_OPTIMIZATION=true >> .env
echo. >> .env
echo # SMTP Email Configuration >> .env
echo SMTP_SERVER=smtp.gmail.com >> .env
echo SMTP_PORT=587 >> .env
echo SMTP_USERNAME=your-email@gmail.com >> .env
echo SMTP_PASSWORD=your-app-password >> .env
echo FROM_EMAIL=noreply@safewave.com >> .env
echo. >> .env
echo # File Upload Configuration >> .env
echo UPLOAD_BASE_DIR=uploads >> .env
echo AUDIO_UPLOAD_DIR=uploads/audio >> .env
echo DOCUMENT_UPLOAD_DIR=uploads/documents >> .env
echo MAX_FILE_SIZE=104857600 >> .env
echo ALLOWED_AUDIO_FORMATS=["mp3","wav","m4a","aac","ogg","flac"] >> .env
echo ALLOWED_DOCUMENT_FORMATS=["pdf","doc","docx","txt","rtf"] >> .env
echo. >> .env
echo # Audio Processing Configuration >> .env
echo AUDIO_CHUNK_SIZE=8192 >> .env
echo ENABLE_AUDIO_STREAMING=true >> .env
echo ENABLE_TRANSCRIPTION=true >> .env
echo ENABLE_LLM_ANALYSIS=true >> .env

if exist ".env" (
    echo ✅ Created .env file with secure values
    echo.
    echo ⚠️  IMPORTANT: Update the following values:
    echo    - OPENAI_API_KEY: Set your actual OpenAI API key
    echo    - SMTP_USERNAME: Set your email for notifications
    echo    - SMTP_PASSWORD: Set your email app password
    echo    - Customize database credentials if needed
    echo.
    echo 🎉 Environment setup complete!
    echo 📝 Next steps:
    echo    1. Review and update .env with your actual values
    echo    2. Run: docker-compose up -d
    echo    3. Check logs: docker-compose logs -f api
    echo.
    echo 💡 Windows-specific tips:
    echo    - Install Docker Desktop from docker.com
    echo    - Install Python from python.org or Microsoft Store
    echo    - Install Poetry: powershell -command "^(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing^).Content | python -"
    echo    - Use Windows Terminal for better command line experience
) else (
    echo ❌ Failed to create .env file
    echo 💡 Make sure you have write permissions in this directory
    exit /b 1
)

goto end

:show_help
echo Safe Wave API Environment Setup - Batch File Edition
echo.
echo Usage: setup_env.bat [OPTIONS]
echo.
echo Options:
echo    --force     Overwrite existing .env file without prompting
echo    --help      Show this help message
echo.
echo Examples:
echo    setup_env.bat           # Interactive setup
echo    setup_env.bat --force   # Force overwrite existing .env
echo.
echo This script creates a secure .env file with randomly generated passwords and secrets.
echo After running this script, make sure to update the API keys and email settings.
echo.
goto end

:end
echo.
pause