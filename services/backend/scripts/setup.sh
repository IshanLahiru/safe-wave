#!/bin/bash
# Safe Wave API Setup Script - Unix Wrapper
# This is the Unix entry point for the Safe Wave backend setup process.

set -e

# Color constants
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored messages
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    echo "=================================================================="
    print_colored "$BLUE" "  $1"
    echo "=================================================================="
}

print_success() {
    print_colored "$GREEN" "✅ $1"
}

print_error() {
    print_colored "$RED" "❌ $1"
}

print_warning() {
    print_colored "$YELLOW" "⚠️  $1"
}

print_info() {
    print_colored "$CYAN" "ℹ️  $1"
}

# Check if help was requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    print_header "Safe Wave API Setup - Unix Shell Wrapper"
    
    echo "Usage: ./scripts/setup.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --quick         Quick setup mode (skip optional confirmations)"
    echo "  --dev           Development mode (install dev dependencies)"
    echo "  --production    Production mode (optimized installation)"
    echo "  --docker-only   Setup Docker containers only"
    echo "  --validate-only Run validation checks only (no changes)"
    echo "  --force         Continue setup even if some steps fail"
    echo "  --background    Start services in background (useful for CI)"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/setup.sh                    # Interactive full setup"
    echo "  ./scripts/setup.sh --quick            # Quick setup"
    echo "  ./scripts/setup.sh --dev              # Development setup"
    echo "  ./scripts/setup.sh --production       # Production setup"
    echo "  ./scripts/setup.sh --validate-only    # Validation only"
    echo ""
    echo "This wrapper automatically calls the Python setup orchestrator with"
    echo "proper platform detection and error handling for Unix systems."
    echo ""
    exit 0
fi

print_header "Safe Wave API Setup - Unix Shell Wrapper"

# Detect system information
SYSTEM=$(uname -s)
ARCH=$(uname -m)
print_info "System: $SYSTEM $ARCH"

# Check if we're in the right directory
if [[ ! -f "scripts/setup.py" ]]; then
    print_error "setup.py not found. Please run this script from the backend directory."
    print_info "Expected location: services/backend/"
    exit 1
fi

# Check for Python 3
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
elif command -v python >/dev/null 2>&1; then
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2)
    # Check if it's Python 3.x
    if [[ $PYTHON_VERSION == 3.* ]]; then
        PYTHON_CMD="python"
    else
        print_error "Python 3.9+ is required, but found Python $PYTHON_VERSION"
        exit 1
    fi
else
    print_error "Python not found. Please install Python 3.9 or later."
    
    # Provide installation guidance based on system
    case "$SYSTEM" in
        "Darwin")
            print_info "Install Python on macOS:"
            echo "  • Download from: https://python.org/downloads/"
            echo "  • Or use Homebrew: brew install python"
            ;;
        "Linux")
            print_info "Install Python on Linux:"
            echo "  • Ubuntu/Debian: sudo apt install python3 python3-pip"
            echo "  • CentOS/RHEL: sudo yum install python3 python3-pip"
            echo "  • Arch: sudo pacman -S python python-pip"
            ;;
        *)
            print_info "Please install Python 3.9+ from https://python.org/downloads/"
            ;;
    esac
    exit 1
fi

print_success "Python found: $PYTHON_VERSION"

# Check Python version (require 3.9+)
MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [[ $MAJOR -lt 3 ]] || [[ $MAJOR -eq 3 && $MINOR -lt 9 ]]; then
    print_error "Python $PYTHON_VERSION is too old. Python 3.9+ is required."
    exit 1
fi

# Check for Poetry
if ! command -v poetry >/dev/null 2>&1; then
    print_warning "Poetry not found. Installing Poetry..."
    
    # Try to install Poetry
    if command -v curl >/dev/null 2>&1; then
        print_info "Installing Poetry via official installer..."
        curl -sSL https://install.python-poetry.org | $PYTHON_CMD -
        
        # Add Poetry to PATH for current session
        export PATH="$HOME/.local/bin:$PATH"
        
        # Check if Poetry is now available
        if command -v poetry >/dev/null 2>&1; then
            print_success "Poetry installed successfully"
        else
            print_error "Poetry installation failed"
            print_info "Please install Poetry manually: https://python-poetry.org/docs/#installation"
            print_info "Then add it to your PATH and re-run this script"
            exit 1
        fi
    else
        print_error "curl not found. Cannot auto-install Poetry."
        print_info "Please install Poetry manually: https://python-poetry.org/docs/#installation"
        exit 1
    fi
else
    POETRY_VERSION=$(poetry --version 2>/dev/null | cut -d' ' -f3 || echo "unknown")
    print_success "Poetry found: $POETRY_VERSION"
fi

# Check for Git (optional but recommended)
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    print_success "Git found: $GIT_VERSION"
else
    print_warning "Git not found (optional but recommended)"
fi

# Check for Docker (optional but recommended for database)
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker found: $DOCKER_VERSION"
    
    # Check if Docker is running
    if docker info >/dev/null 2>&1; then
        print_success "Docker is running"
    else
        print_warning "Docker is installed but not running"
        print_info "Please start Docker and re-run this script for full functionality"
    fi
else
    print_warning "Docker not found (required for database)"
    print_info "Please install Docker from: https://docs.docker.com/get-docker/"
fi

print_info "Starting Python setup orchestrator..."
echo

# Execute the Python setup script with all arguments
exec $PYTHON_CMD scripts/setup.py "$@"