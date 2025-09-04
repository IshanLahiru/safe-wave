# Safe Wave API Environment Setup Script - PowerShell
# This script helps you create a .env file with secure values on Windows.

param(
    [switch]$Force,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Safe Wave API Environment Setup - PowerShell Edition

Usage: .\scripts\setup_env.ps1 [OPTIONS]

Options:
    -Force      Overwrite existing .env file without prompting
    -Help       Show this help message

Examples:
    .\scripts\setup_env.ps1           # Interactive setup
    .\scripts\setup_env.ps1 -Force    # Force overwrite existing .env

This script creates a secure .env file with randomly generated passwords and secrets.
"@ -ForegroundColor Green
    exit 0
}

Write-Host "🚀 Safe Wave API Environment Setup" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Check if .env already exists
if (Test-Path ".env") {
    if (-not $Force) {
        $response = Read-Host "⚠️  .env already exists. Overwrite? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "❌ Setup cancelled" -ForegroundColor Red
            exit 0
        }
    } else {
        Write-Host "🔄 Force mode: Overwriting existing .env file" -ForegroundColor Yellow
    }
}

# Function to generate secure random string
function New-SecureRandomString {
    param(
        [int]$Length = 32
    )
    
    try {
        # Try using .NET crypto for secure random generation
        $bytes = New-Object byte[] $Length
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        $rng.Dispose()
        return [Convert]::ToBase64String($bytes) -replace '[+/=]', '' | Select-Object -First $Length
    } catch {
        # Fallback to GUID-based generation
        $guid1 = [System.Guid]::NewGuid().ToString("N")
        $guid2 = [System.Guid]::NewGuid().ToString("N") 
        return ($guid1 + $guid2).Substring(0, $Length)
    }
}

# Generate secure random values
Write-Host "🔐 Generating secure random values..." -ForegroundColor Yellow

try {
    $secretKey = New-SecureRandomString -Length 32
    $dbPassword = New-SecureRandomString -Length 16
    
    Write-Host "✅ Secure values generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generating secure values: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Using fallback generation method..." -ForegroundColor Yellow
    
    # Fallback method
    $secretKey = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N").Substring(0, 32)
    $dbPassword = [System.Guid]::NewGuid().ToString("N").Substring(0, 16)
}

# Create .env file content
$envContent = @"
# Database Configuration
POSTGRES_DB=safewave
POSTGRES_USER=safewave_user
POSTGRES_PASSWORD=$dbPassword
POSTGRES_PORT=5433
DATABASE_URL=postgresql://safewave_user:$dbPassword@localhost:5433/safewave

# JWT Configuration
SECRET_KEY=$secretKey
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
"@

# Write .env file
try {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
    Write-Host "✅ Created .env file with secure values" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update the following values:" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY: Set your actual OpenAI API key" -ForegroundColor Cyan
    Write-Host "   - SMTP_USERNAME: Set your email for notifications" -ForegroundColor Cyan
    Write-Host "   - SMTP_PASSWORD: Set your email app password" -ForegroundColor Cyan
    Write-Host "   - Customize database credentials if needed" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
    Write-Host "📝 Next steps:" -ForegroundColor Blue
    Write-Host "   1. Review and update .env with your actual values" -ForegroundColor White
    Write-Host "   2. Run: docker-compose up -d" -ForegroundColor White
    Write-Host "   3. Check logs: docker-compose logs -f api" -ForegroundColor White
    
    Write-Host ""
    Write-Host "💡 Pro tips for Windows users:" -ForegroundColor Magenta
    Write-Host "   - Use Docker Desktop for easy container management" -ForegroundColor White
    Write-Host "   - Consider WSL2 for better Docker performance" -ForegroundColor White
    Write-Host "   - Use Windows Terminal for better PowerShell experience" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to create .env file: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure you have write permissions in this directory" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Windows-specific setup recommendations:" -ForegroundColor Blue
Write-Host "   - Install Python from python.org or Microsoft Store" -ForegroundColor White
Write-Host "   - Install Poetry: (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -" -ForegroundColor White
Write-Host "   - Install Docker Desktop from docker.com" -ForegroundColor White
Write-Host "   - Consider adding Python and Poetry to your PATH" -ForegroundColor White

exit 0