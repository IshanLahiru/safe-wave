# Docker Management for Safe Wave Backend

This document describes the Docker container management setup for the Safe Wave backend service. We provide two complementary approaches for managing Docker containers:

1. **NPM Scripts** (from Turborepo root) - Simple command-line interface
2. **Python Scripts** (from backend directory) - Programmatic control with Docker SDK

## Overview

The backend uses Docker Compose to orchestrate two main services:
- **postgres**: PostgreSQL database server
- **api**: FastAPI backend application

## NPM Scripts (Turborepo Root)

Run these commands from the monorepo root directory:

### Available Commands

```bash
# Start containers in detached mode
npm run docker:up

# Stop and remove containers
npm run docker:down

# Stop containers without removing them
npm run docker:stop

# Restart containers
npm run docker:restart

# View container logs (follow mode)
npm run docker:logs

# Check running containers
npm run docker:ps
```

### Examples

```bash
# Start the entire stack
npm run docker:up

# View real-time logs
npm run docker:logs

# Stop everything when done
npm run docker:down
```

## Python Scripts (Backend Directory)

The Python Docker manager provides more advanced functionality and can be used both as a CLI tool and as an importable module.

### Prerequisites

Install the Docker SDK for Python:

```bash
cd services/backend
pip install docker
```

Or install all dependencies:

```bash
pip install -r requirements.txt
```

### CLI Usage

Run these commands from the `services/backend` directory:

```bash
# Start containers
python scripts/docker_manager.py up

# Start containers with rebuild
python scripts/docker_manager.py up --build

# Stop and remove containers
python scripts/docker_manager.py down

# Stop and remove containers with volumes
python scripts/docker_manager.py down --volumes

# Stop containers only
python scripts/docker_manager.py stop

# Restart containers
python scripts/docker_manager.py restart

# Check container status
python scripts/docker_manager.py status

# View logs (all services)
python scripts/docker_manager.py logs

# View logs for specific service
python scripts/docker_manager.py logs api
python scripts/docker_manager.py logs postgres

# View logs without following
python scripts/docker_manager.py logs --no-follow
```

### NPM Script Shortcuts (Backend)

You can also use npm scripts from the backend directory:

```bash
cd services/backend

# Basic operations
npm run docker:up
npm run docker:down
npm run docker:stop
npm run docker:restart
npm run docker:status
npm run docker:logs
```

### Programmatic Usage

Import and use the functions in your Python scripts:

```python
from scripts.docker_manager import (
    up_container,
    down_container,
    stop_container,
    restart_container,
    check_container_status,
    show_logs
)

# Start containers
if up_container():
    print("Containers started successfully!")

# Check status
status = check_container_status()
for container_name, info in status.items():
    print(f"{container_name}: {info['status']}")

# Stop containers
down_container()
```

### Advanced Usage

```python
from scripts.docker_manager import DockerManager

# Create manager instance
manager = DockerManager()

# Start with custom options
manager.up_container(detached=True, build=True)

# Show logs for specific service
manager.show_logs(service="api", follow=False, tail=50)

# Get detailed status
status = manager.check_container_status()
```

## Environment Configuration

The Docker setup uses environment variables that can be configured in a `.env` file in the backend directory:

```bash
# Database configuration
POSTGRES_DB=safewave
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_PORT=5433

# API configuration
API_PORT=9000
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key

# Email configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@safewave.com
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error connecting to Docker: ...
   ```
   Solution: Start Docker Desktop or Docker daemon

2. **Permission denied**
   ```
   Permission denied while trying to connect to Docker
   ```
   Solution: Add your user to the docker group or run with sudo

3. **Port conflicts**
   ```
   Port 5433 is already in use
   ```
   Solution: Change the port in your `.env` file or stop conflicting services

4. **Container build failures**
   ```
   Failed to build image
   ```
   Solution: Run with `--build` flag to force rebuild

### Useful Commands

```bash
# View all containers (including stopped)
docker ps -a

# View container logs directly
docker logs safewave-api-1
docker logs safewave-postgres-1

# Execute commands in running containers
docker exec -it safewave-api-1 bash
docker exec -it safewave-postgres-1 psql -U user -d safewave

# Clean up everything (use with caution)
docker system prune -a
```

## Integration with Development Workflow

### Recommended Workflow

1. **Start development environment:**
   ```bash
   npm run docker:up
   ```

2. **Check that everything is running:**
   ```bash
   npm run docker:ps
   ```

3. **View logs during development:**
   ```bash
   npm run docker:logs
   ```

4. **Stop when done:**
   ```bash
   npm run docker:down
   ```

### CI/CD Integration

The Python scripts can be easily integrated into CI/CD pipelines:

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

# Run your tests here...
```

## File Structure

```
services/backend/
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # API container definition
├── scripts/
│   ├── docker_manager.py       # Python Docker management script
│   └── DOCKER_MANAGEMENT.md    # This documentation
├── requirements.txt            # Python dependencies (includes docker SDK)
└── package.json               # NPM scripts for Docker management
```

## Support

For issues or questions about Docker management:

1. Check the troubleshooting section above
2. Review Docker and Docker Compose logs
3. Ensure all prerequisites are installed
4. Verify environment configuration

The dual approach (NPM + Python) ensures you can manage containers efficiently whether you're doing quick operations from the root or need programmatic control from Python scripts.
