# Safe Wave Backend - Cross-Platform Setup Automation

This directory contains comprehensive cross-platform setup automation scripts that resolve Windows compatibility issues and provide enterprise-grade deployment automation for the Safe Wave backend.

## 🌐 Cross-Platform Support

### Supported Platforms
- **Windows 10/11** - PowerShell (.ps1) and Command Prompt (.bat)  
- **macOS** - Intel and Apple Silicon (M1/M2/M3)
- **Linux** - Ubuntu, CentOS, Arch, and other major distributions

### Platform Detection
Scripts automatically detect the operating system and architecture, providing platform-specific optimizations and error handling.

## 🚀 Quick Start

### Universal Setup (Recommended)
```bash
# Unix/Linux/macOS
./scripts/setup.sh

# Windows PowerShell  
.\scripts\setup.ps1

# Windows Command Prompt
scripts\setup.bat

# Cross-platform Python
python scripts/setup.py
```

### Workspace-Level Commands
```bash
# From project root
npm run setup              # Full interactive setup
npm run setup:quick        # Quick setup (minimal prompts)
npm run setup:dev          # Development setup
npm run setup:production   # Production setup
npm run setup:validate     # Validation only
```

### Poetry Integration
```bash
# From backend directory  
poetry run setup           # Full setup
poetry run setup-quick     # Quick setup
poetry run setup-dev       # Development setup
poetry run setup-env       # Environment setup only
```

## 📋 Available Scripts

### Setup Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `setup.py` | Cross-platform | Master setup orchestrator with comprehensive validation |
| `setup.sh` | Unix/Linux/macOS | Shell wrapper with dependency validation |
| `setup.ps1` | Windows PowerShell | PowerShell wrapper with Windows-specific optimizations |
| `setup.bat` | Windows CMD | Batch file wrapper for Command Prompt users |

### Environment Configuration

| Script | Platform | Description |
|--------|----------|-------------|
| `setup_env.py` | Cross-platform | Enhanced environment configuration with platform detection |
| `setup_env.sh` | Unix/Linux/macOS | Shell-based environment setup |
| `setup_env.ps1` | Windows PowerShell | PowerShell environment setup |
| `setup_env.bat` | Windows CMD | Batch file environment setup |

### Port Management

| Script | Platform | Description |
|--------|----------|-------------|
| `kill_port.py` | Cross-platform | Enhanced port process killer with Docker integration |
| `kill_port.sh` | Unix/Linux/macOS | Shell-based port management |
| `kill_port.ps1` | Windows PowerShell | PowerShell port management |
| `kill_port.bat` | Windows CMD | Batch file port management |

### Deployment Automation

| Script | Platform | Description |
|--------|----------|-------------|
| `deploy.ps1` | Windows PowerShell | Complete deployment automation for Windows |

## 🔧 Setup Options

### Interactive Setup (Default)
```bash
./scripts/setup.sh
```
- Full system validation
- Interactive confirmations
- Comprehensive error handling
- Step-by-step progress tracking

### Quick Setup
```bash
./scripts/setup.sh --quick
```
- Minimal prompts
- Assumes sensible defaults
- Faster execution
- Suitable for CI/CD

### Development Setup
```bash
./scripts/setup.sh --dev
```
- Installs development dependencies
- Enables development tools
- Configures development environment
- Sets up debugging tools

### Production Setup
```bash
./scripts/setup.sh --production
```
- Production-optimized installation
- Minimal dependencies
- Security-focused configuration
- Performance optimizations

### Validation Only
```bash
./scripts/setup.sh --validate-only
```
- System validation without changes
- Dependency checking
- Configuration verification
- Health checks

## 🐳 Docker Integration

The setup automation includes comprehensive Docker support:

### Docker Container Management
- Automatic Docker Desktop detection
- Container health checking
- Port conflict resolution
- Database initialization

### Docker Compose Integration
- PostgreSQL database setup
- Redis cache configuration
- Network configuration
- Volume management

## 🔑 Environment Configuration

### Secure Defaults
- Cryptographically secure random values
- JWT secret generation
- Database password generation
- Best practice configurations

### Platform-Specific Optimizations
- **Windows**: PowerShell execution policies, Windows Defender exclusions
- **macOS**: Homebrew integration, Apple Silicon compatibility
- **Linux**: Package manager detection, distribution-specific handling

## 🛠️ Port Management

### Cross-Platform Process Detection
```bash
# Kill processes on default backend port (9000)
poetry run kill-port

# Kill processes on specific port
poetry run kill-port 8080

# Kill all backend-related processes
poetry run kill-ports-all

# List processes without killing
poetry run kill-ports-list
```

### Enhanced Features
- Docker container integration
- Process hierarchy detection
- Graceful vs. force termination
- Interactive process selection
- Comprehensive error handling

## 🏗️ Architecture

### Master Setup Orchestrator
The `setup.py` script serves as the universal entry point:

1. **Platform Detection** - Automatic OS and architecture detection
2. **Dependency Validation** - Comprehensive system requirements checking
3. **Environment Setup** - Secure configuration file generation
4. **Dependency Installation** - Poetry-managed Python dependencies
5. **Database Setup** - Docker container orchestration
6. **Migration Execution** - Database schema management
7. **Service Startup** - Development server initialization

### Platform Wrappers
Platform-specific wrappers provide:
- Native user experience
- Platform-specific error messages
- Installation guidance
- Dependency management
- Shell integration

## 🔍 Troubleshooting

### Common Issues

#### Python Version Issues
```bash
# Check Python version
python --version
python3 --version

# Install Python 3.9+ from python.org
```

#### Poetry Installation Issues
```bash
# Windows PowerShell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Unix/Linux/macOS  
curl -sSL https://install.python-poetry.org | python3 -
```

#### Docker Issues
```bash
# Check Docker status
docker --version
docker info

# Start Docker Desktop (Windows/macOS)
# Or start Docker daemon (Linux)
```

#### Permission Issues
```bash
# Windows: Run as Administrator
# Unix/Linux: Use sudo if needed
# macOS: Check System Preferences > Security & Privacy
```

### Platform-Specific Tips

#### Windows
- Use PowerShell for best experience
- Run as Administrator if permission issues occur
- Ensure Docker Desktop is installed and running
- Windows Defender may need exclusions for development folders

#### macOS
- Install Xcode Command Line Tools: `xcode-select --install`
- Use Homebrew for package management: `brew install python poetry`
- For Apple Silicon, ensure proper Docker emulation settings

#### Linux
- Install build essentials: `sudo apt install build-essential python3-dev`
- Ensure user is in docker group: `sudo usermod -aG docker $USER`
- May need to install python3-venv: `sudo apt install python3-venv`

## 🧪 Testing

### Validation Commands
```bash
# Test setup validation
./scripts/setup.sh --validate-only

# Test environment creation
poetry run setup-env --force

# Test port management
poetry run kill-ports-list
```

### Integration Testing
```bash
# Full setup test (development)
./scripts/setup.sh --dev --background

# Production setup test
./scripts/setup.sh --production --validate-only
```

## 📚 Integration with Existing Workflows

### Poetry Scripts
All scripts are integrated into Poetry for easy access:
```bash
poetry run setup           # Full setup
poetry run setup-quick     # Quick setup
poetry run kill-port       # Port management
```

### Turborepo Tasks
Integrated with Turborepo for monorepo workflows:
```bash
turbo run setup --filter=backend
turbo run setup:dev --filter=backend
```

### NPM Scripts
Available at both workspace and package levels:
```bash
# Workspace level
npm run setup
npm run setup:backend

# Package level (from backend directory)
npm run setup
npm run setup:dev
```

## 🔐 Security Considerations

### Secure Defaults
- Random secret generation using cryptographically secure methods
- Environment variable validation
- File permission checking
- Secure database credentials

### Platform Security
- Windows: PowerShell execution policy handling
- macOS: Keychain integration considerations
- Linux: File permission and ownership management

## 📈 Performance Optimizations

### Caching
- Poetry dependency caching
- Docker layer optimization
- Turborepo task caching

### Parallel Execution
- Concurrent dependency installation
- Parallel container startup
- Background process management

## 🤝 Contributing

### Adding Platform Support
1. Create platform-specific wrapper script
2. Update master orchestrator for platform detection
3. Add platform-specific optimizations
4. Update documentation and tests

### Extending Functionality
1. Add new setup stages to orchestrator
2. Implement platform-specific variants
3. Update integration points (Poetry, Turborepo, NPM)
4. Add comprehensive error handling

---

## 📞 Support

For issues with cross-platform setup automation:

1. **Check the troubleshooting section above**
2. **Run validation**: `./scripts/setup.sh --validate-only`
3. **Review logs** for specific error messages
4. **Check platform-specific requirements**

The cross-platform setup automation is designed to handle most common scenarios automatically while providing clear guidance when manual intervention is needed.
