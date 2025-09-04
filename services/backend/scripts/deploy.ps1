# Safe Wave API Complete Deployment Script - PowerShell
# This script handles the complete setup and deployment of the Safe Wave backend on Windows.

param(
    [switch]$SkipDependencyCheck,
    [switch]$SkipEnvironmentSetup,
    [switch]$SkipDatabaseSetup,
    [switch]$Force,
    [switch]$DevMode,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Safe Wave API Complete Deployment - PowerShell Edition

Usage: .\scripts\deploy.ps1 [OPTIONS]

Options:
    -SkipDependencyCheck     Skip dependency validation (faster but risky)
    -SkipEnvironmentSetup    Skip .env file creation
    -SkipDatabaseSetup       Skip database initialization
    -Force                   Force overwrite existing configurations
    -DevMode                 Setup for development (includes dev dependencies)
    -Help                    Show this help message

Examples:
    .\scripts\deploy.ps1                    # Full setup with all checks
    .\scripts\deploy.ps1 -DevMode           # Development setup
    .\scripts\deploy.ps1 -Force             # Force setup, overwrite existing files
    .\scripts\deploy.ps1 -SkipDependencyCheck  # Skip dependency validation

This script will:
    1. Validate system dependencies (Python, Poetry, Docker)
    2. Create secure .env configuration
    3. Install Python dependencies via Poetry
    4. Setup and initialize database
    5. Start the development server
"@ -ForegroundColor Green
    exit 0
}

# Color constants for consistent output
$Colors = @{
    Header = "Blue"
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Progress = "Magenta"
}

# Global error tracking
$Script:HasErrors = $false
$Script:WarningCount = 0

# Utility functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor $Colors.Header
    Write-Host $Message -ForegroundColor $Colors.Header
    Write-Host "=" * 60 -ForegroundColor $Colors.Header
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "🔧 $Message" -ForegroundColor $Colors.Progress
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Success
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Warning
    $Script:WarningCount++
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Error
    $Script:HasErrors = $true
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Info
}

# Function to check if a command exists
function Test-Command {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to get version of a command
function Get-CommandVersion {
    param([string]$Command, [string]$VersionArg = "--version")
    
    try {
        $output = & $Command $VersionArg 2>&1 | Select-Object -First 1
        return $output.ToString().Trim()
    } catch {
        return "Unknown"
    }
}

# Function to validate system dependencies
function Test-SystemDependencies {
    Write-Step "Validating system dependencies"
    
    $dependencies = @(
        @{ Name = "Python"; Command = "python"; MinVersion = "3.9.0" },
        @{ Name = "Poetry"; Command = "poetry"; MinVersion = "1.0.0" },
        @{ Name = "Docker"; Command = "docker"; MinVersion = "20.0.0" },
        @{ Name = "Git"; Command = "git"; MinVersion = "2.0.0" }
    )
    
    $allGood = $true
    
    foreach ($dep in $dependencies) {
        if (Test-Command $dep.Command) {
            $version = Get-CommandVersion $dep.Command
            Write-Success "$($dep.Name) is available: $version"
        } else {
            Write-Error "$($dep.Name) is not installed or not in PATH"
            $allGood = $false
            
            # Provide installation guidance
            switch ($dep.Name) {
                "Python" {
                    Write-Info "Install Python from: https://python.org/downloads/ or Microsoft Store"
                    Write-Info "Make sure to check 'Add Python to PATH' during installation"
                }
                "Poetry" {
                    Write-Info "Install Poetry with: (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -"
                }
                "Docker" {
                    Write-Info "Install Docker Desktop from: https://docker.com/products/docker-desktop"
                }
                "Git" {
                    Write-Info "Install Git from: https://git-scm.com/download/win"
                }
            }
        }
    }
    
    # Check Python version specifically
    if (Test-Command "python") {
        try {
            $pythonVersion = python --version 2>&1
            if ($pythonVersion -match "Python (\d+)\.(\d+)\.(\d+)") {
                $major = [int]$matches[1]
                $minor = [int]$matches[2]
                
                if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 9)) {
                    Write-Error "Python version $pythonVersion is too old. Required: Python 3.9+"
                    $allGood = $false
                } else {
                    Write-Success "Python version is compatible: $pythonVersion"
                }
            }
        } catch {
            Write-Warning "Could not determine Python version"
        }
    }
    
    # Check Docker status
    if (Test-Command "docker") {
        try {
            $dockerInfo = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker is running and accessible"
            } else {
                Write-Warning "Docker is installed but not running"
                Write-Info "Start Docker Desktop before continuing"
            }
        } catch {
            Write-Warning "Could not check Docker status"
        }
    }
    
    return $allGood
}

# Function to setup environment file
function Initialize-Environment {
    Write-Step "Setting up environment configuration"
    
    if (Test-Path ".env" -and -not $Force) {
        Write-Info ".env file already exists"
        $response = Read-Host "Do you want to recreate it? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info "Skipping environment setup"
            return $true
        }
    }
    
    try {
        $setupArgs = @()
        if ($Force) {
            $setupArgs += "-Force"
        }
        
        & ".\scripts\setup_env.ps1" @setupArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Environment configuration created successfully"
            return $true
        } else {
            Write-Error "Failed to create environment configuration"
            return $false
        }
    } catch {
        Write-Error "Error running environment setup: $($_.Exception.Message)"
        return $false
    }
}

# Function to install Python dependencies
function Install-PythonDependencies {
    Write-Step "Installing Python dependencies with Poetry"
    
    try {
        # Configure Poetry to create virtual environment in project
        poetry config virtualenvs.in-project true
        Write-Info "Configured Poetry to use local virtual environment"
        
        # Install dependencies
        if ($DevMode) {
            Write-Info "Installing development dependencies..."
            poetry install --with dev,test
        } else {
            Write-Info "Installing production dependencies..."
            poetry install --only main
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Python dependencies installed successfully"
            return $true
        } else {
            Write-Error "Failed to install Python dependencies"
            return $false
        }
    } catch {
        Write-Error "Error installing dependencies: $($_.Exception.Message)"
        return $false
    }
}

# Function to setup database
function Initialize-Database {
    Write-Step "Setting up database"
    
    try {
        # Start Docker containers
        Write-Info "Starting Docker containers..."
        docker-compose up -d db redis
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start database containers"
            return $false
        }
        
        # Wait for database to be ready
        Write-Info "Waiting for database to be ready..."
        $maxAttempts = 30
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            
            try {
                $result = docker-compose exec -T db pg_isready -U safewave_user -d safewave 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Database is ready"
                    break
                }
            } catch {
                # Continue trying
            }
            
            if ($attempt -eq $maxAttempts) {
                Write-Error "Database did not become ready in time"
                return $false
            }
            
            Write-Host "." -NoNewline -ForegroundColor Yellow
        } while ($attempt -lt $maxAttempts)
        
        Write-Host ""
        
        # Run database migrations
        Write-Info "Running database migrations..."
        poetry run alembic upgrade head
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database migrations completed"
        } else {
            Write-Warning "Database migrations had issues, but continuing..."
        }
        
        return $true
    } catch {
        Write-Error "Error setting up database: $($_.Exception.Message)"
        return $false
    }
}

# Function to verify installation
function Test-Installation {
    Write-Step "Verifying installation"
    
    $checks = @()
    
    # Check .env file
    if (Test-Path ".env") {
        $checks += "✅ Environment configuration exists"
    } else {
        $checks += "❌ Environment configuration missing"
    }
    
    # Check virtual environment
    if (Test-Path ".venv") {
        $checks += "✅ Python virtual environment exists"
    } else {
        $checks += "❌ Python virtual environment missing"
    }
    
    # Check Docker containers
    try {
        $containers = docker-compose ps --services --filter "status=running" 2>$null
        if ($containers) {
            $checks += "✅ Docker containers are running"
        } else {
            $checks += "⚠️  Docker containers not running"
        }
    } catch {
        $checks += "⚠️  Could not check Docker status"
    }
    
    # Display results
    Write-Info "Installation verification:"
    foreach ($check in $checks) {
        Write-Host "   $check"
    }
    
    return $checks -notcontains "❌*"
}

# Function to start development server
function Start-DevelopmentServer {
    Write-Step "Starting development server"
    
    Write-Info "The development server will start on http://localhost:9000"
    Write-Info "Press Ctrl+C to stop the server"
    Write-Info ""
    Write-Info "API Documentation will be available at:"
    Write-Info "  - Swagger UI: http://localhost:9000/docs"
    Write-Info "  - ReDoc: http://localhost:9000/redoc"
    Write-Info ""
    
    try {
        poetry run python main.py
    } catch {
        Write-Error "Failed to start development server: $($_.Exception.Message)"
        return $false
    }
}

# Main deployment process
function Start-Deployment {
    Write-Header "Safe Wave API Deployment - Windows PowerShell"
    
    Write-Info "Starting deployment process..."
    Write-Info "Current directory: $(Get-Location)"
    Write-Info "PowerShell version: $($PSVersionTable.PSVersion)"
    Write-Info "Windows version: $(Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Caption)"
    
    # Step 1: Validate dependencies
    if (-not $SkipDependencyCheck) {
        if (-not (Test-SystemDependencies)) {
            if (-not $Force) {
                Write-Error "Dependency validation failed. Use -Force to continue anyway."
                return $false
            } else {
                Write-Warning "Continuing despite dependency issues (Force mode)"
            }
        }
    } else {
        Write-Warning "Skipping dependency check (may cause issues)"
    }
    
    # Step 2: Setup environment
    if (-not $SkipEnvironmentSetup) {
        if (-not (Initialize-Environment)) {
            Write-Error "Environment setup failed"
            return $false
        }
    } else {
        Write-Info "Skipping environment setup"
    }
    
    # Step 3: Install Python dependencies
    if (-not (Install-PythonDependencies)) {
        Write-Error "Python dependency installation failed"
        return $false
    }
    
    # Step 4: Setup database
    if (-not $SkipDatabaseSetup) {
        if (-not (Initialize-Database)) {
            Write-Error "Database setup failed"
            return $false
        }
    } else {
        Write-Info "Skipping database setup"
    }
    
    # Step 5: Verify installation
    if (-not (Test-Installation)) {
        Write-Warning "Installation verification found issues"
    }
    
    return $true
}

# Execute main deployment
try {
    $success = Start-Deployment
    
    if ($success) {
        Write-Header "Deployment Complete!"
        Write-Success "Safe Wave API is ready!"
        
        if ($Script:WarningCount -gt 0) {
            Write-Warning "Deployment completed with $($Script:WarningCount) warning(s)"
        }
        
        Write-Info "Next steps:"
        Write-Info "  1. Review .env file and update API keys"
        Write-Info "  2. Run: poetry run python main.py"
        Write-Info "  3. Visit: http://localhost:9000/docs"
        
        # Ask if user wants to start the server
        if (-not $SkipDatabaseSetup) {
            Write-Host ""
            $response = Read-Host "Start the development server now? (Y/n)"
            if ($response -ne "n" -and $response -ne "N") {
                Start-DevelopmentServer
            }
        }
        
        exit 0
    } else {
        Write-Header "Deployment Failed!"
        Write-Error "The deployment process encountered errors"
        Write-Info "Check the error messages above and try again"
        Write-Info "Use -Help for more options"
        exit 1
    }
    
} catch {
    Write-Error "Unexpected error during deployment: $($_.Exception.Message)"
    Write-Info "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}