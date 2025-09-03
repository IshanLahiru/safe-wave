#!/bin/bash
# Quick port killer script for Safe Wave Backend
# Usage: ./scripts/kill_port.sh [port] [--force]

set -e

# Default port
PORT=${1:-9000}
FORCE=${2:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Safe Wave Port Killer${NC}"
echo -e "Checking port ${YELLOW}${PORT}${NC}..."

# Check if port is in use
if command -v lsof >/dev/null 2>&1; then
    # macOS/Linux with lsof
    PIDS=$(lsof -ti :${PORT} 2>/dev/null || true)
elif command -v netstat >/dev/null 2>&1; then
    # Windows or systems without lsof
    PIDS=$(netstat -ano 2>/dev/null | grep ":${PORT}" | grep "LISTENING" | awk '{print $5}' | sort -u || true)
else
    echo -e "${RED}❌ No suitable tools found (lsof or netstat)${NC}"
    exit 1
fi

if [ -z "$PIDS" ]; then
    echo -e "${GREEN}✅ Port ${PORT} is available${NC}"
    exit 0
fi

echo -e "${RED}🔴 Found processes on port ${PORT}:${NC}"
for PID in $PIDS; do
    if command -v ps >/dev/null 2>&1; then
        PROCESS_INFO=$(ps -p $PID -o pid,comm,command 2>/dev/null | tail -n 1 || echo "$PID unknown unknown")
        echo -e "   ${YELLOW}PID ${PID}:${NC} $PROCESS_INFO"
    else
        echo -e "   ${YELLOW}PID ${PID}${NC}"
    fi
done

# Ask for confirmation unless --force is specified
if [ "$FORCE" != "--force" ]; then
    echo ""
    read -p "❓ Kill these processes? [y/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Operation cancelled${NC}"
        exit 0
    fi
fi

# Kill processes
echo -e "${BLUE}🔫 Killing processes...${NC}"
SUCCESS=true

for PID in $PIDS; do
    if [ "$FORCE" == "--force" ]; then
        # Force kill with SIGKILL
        if kill -9 $PID 2>/dev/null; then
            echo -e "${GREEN}✅ Force killed PID ${PID}${NC}"
        else
            echo -e "${RED}❌ Failed to kill PID ${PID}${NC}"
            SUCCESS=false
        fi
    else
        # Graceful kill with SIGTERM
        if kill $PID 2>/dev/null; then
            echo -e "${GREEN}✅ Killed PID ${PID}${NC}"
        else
            echo -e "${RED}❌ Failed to kill PID ${PID}${NC}"
            SUCCESS=false
        fi
    fi
done

if [ "$SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 All processes killed successfully!${NC}"
    echo -e "${BLUE}💡 Port ${PORT} should now be available${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some processes could not be killed${NC}"
    echo -e "${YELLOW}💡 Try running with --force or with sudo/admin privileges${NC}"
    exit 1
fi
