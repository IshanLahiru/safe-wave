# Docker Management for Safe Wave Monorepo

This document provides an overview of the Docker container management setup for the Safe Wave Turborepo monorepo.

## Overview

The Safe Wave backend uses Docker Compose to orchestrate two main services:
- **postgres**: PostgreSQL database server (port 5433)
- **api**: FastAPI backend application (port 9000)

We provide **dual Docker management approaches** for maximum flexibility:

1. **NPM Scripts** (from Turborepo root) - Quick command-line operations
2. **Python Scripts** (from backend directory) - Advanced programmatic control

## Quick Start

### From Turborepo Root (NPM Scripts)

```bash
# Start all containers
npm run docker:up

# Check container status
npm run docker:ps

# View logs
npm run docker:logs

# Stop and remove containers
npm run docker:down
```

### From Backend Directory (Python Scripts)

```bash
cd services/backend

# Check status with detailed information
python scripts/docker_manager.py status

# Start containers
python scripts/docker_manager.py up

# View logs for specific service
python scripts/docker_manager.py logs api

# Stop containers
python scripts/docker_manager.py down
```

## Available Commands

### NPM Scripts (Root Level)

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start containers in detached mode |
| `npm run docker:down` | Stop and remove containers |
| `npm run docker:stop` | Stop containers without removing |
| `npm run docker:restart` | Restart containers |
| `npm run docker:logs` | View container logs (follow mode) |
| `npm run docker:ps` | Check running containers |
| `npm run kill:port` | Kill processes on backend port (9000) |
| `npm run kill:port:force` | Force kill processes on backend port |
| `npm run kill:all` | Kill processes on all common backend ports |
| `npm run kill:list` | List processes on common backend ports |

### Python Scripts (Backend Level)

| Command | Description |
|---------|-------------|
| `python scripts/docker_manager.py up` | Start containers |
| `python scripts/docker_manager.py down` | Stop and remove containers |
| `python scripts/docker_manager.py stop` | Stop containers only |
| `python scripts/docker_manager.py restart` | Restart containers |
| `python scripts/docker_manager.py status` | Detailed container status |
| `python scripts/docker_manager.py logs [service]` | View logs (optionally for specific service) |

### Backend NPM Shortcuts

From `services/backend` directory:

```bash
npm run docker:up
npm run docker:down
npm run docker:status
npm run docker:logs
```

## Advanced Python Usage

### CLI Options

```bash
# Start with rebuild
python scripts/docker_manager.py up --build

# Stop and remove volumes
python scripts/docker_manager.py down --volumes

# View logs without following
python scripts/docker_manager.py logs --no-follow

# View logs for specific service
python scripts/docker_manager.py logs postgres
```

### Programmatic Usage

```python
from scripts.docker_manager import (
    up_container,
    down_container,
    check_container_status
)

# Start containers
if up_container():
    print("✅ Containers started!")

# Check status
status = check_container_status()
for name, info in status.items():
    print(f"{name}: {info['status']}")
```

## File Structure

```
/
├── package.json                           # Root npm scripts
├── services/backend/
│   ├── docker-compose.yml                 # Docker Compose config
│   ├── Dockerfile                         # API container definition
│   ├── requirements.txt                   # Python deps (includes docker SDK)
│   ├── package.json                       # Backend npm scripts
│   └── scripts/
│       ├── docker_manager.py              # Python Docker management
│       └── DOCKER_MANAGEMENT.md           # Detailed documentation
└── DOCKER_MANAGEMENT_README.md            # This file
```

## Environment Configuration

Create a `.env` file in `services/backend/` with:

```bash
# Database
POSTGRES_DB=safewave
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_PORT=5433

# API
API_PORT=9000
SECRET_KEY=your-secret-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@safewave.com
```

## Prerequisites

### For NPM Scripts
- Docker and Docker Compose installed
- Node.js and npm

### For Python Scripts
- Docker SDK for Python: `pip install docker`
- Or install all dependencies: `pip install -r requirements.txt`

## Troubleshooting

### Common Issues

1. Docker not running: Start Docker Desktop
2. Port conflicts: Use port killer scripts to free up ports
3. Permission denied: Add user to docker group or use sudo
4. Build failures: Use `--build` flag to force rebuild

### Port Conflict Resolution

If you get "port already in use" errors:

```bash
# Check what's using the ports
npm run kill:list

# Kill processes on backend port
npm run kill:port

# Kill all backend-related ports
npm run kill:all

# Then restart Docker
npm run docker:up
```

### Useful Commands

```bash
# View all containers
docker ps -a

# Clean up everything (use with caution)
docker system prune -a

# Execute commands in running containers
docker exec -it backend-postgres-1 psql -U user -d safewave
docker exec -it backend-api-1 bash
```

## Integration Examples

### Development Workflow

```bash
# 1. Start development environment
npm run docker:up

# 2. Check everything is running
npm run docker:ps

# 3. View logs during development
npm run docker:logs

# 4. Stop when done
npm run docker:down
```

### CI/CD Integration

```python
# In your CI script
from scripts.docker_manager import up_container, check_container_status

# Start containers for testing
if not up_container():
    exit(1)

# Verify containers are healthy
status = check_container_status()
if not all(info['status'] == 'running' for info in status.values()):
    exit(1)

# Run tests...
```

## Benefits of Dual Approach

- **NPM Scripts**: Quick operations, familiar to frontend developers
- **Python Scripts**: Advanced control, perfect for automation and CI/CD
- **Consistency**: Both approaches manage the same Docker setup
- **Flexibility**: Choose the right tool for each situation

## Documentation

For detailed information, see:
- `services/backend/scripts/DOCKER_MANAGEMENT.md` - Comprehensive Python script documentation
- `services/backend/docker-compose.yml` - Docker Compose configuration
- `services/backend/Dockerfile` - API container definition

## Support

The dual Docker management approach ensures you can efficiently manage containers whether you're doing quick operations from the Turborepo root or need programmatic control from Python scripts.
