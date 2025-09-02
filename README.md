# Safe Wave Monorepo

This is a Turborepo monorepo containing the Safe Wave application with a React Native frontend and Python FastAPI backend.

## Project Structure

```
safe-wave/
├── app/native/          # React Native/Expo frontend
├── services/backend/    # Python FastAPI backend
├── package.json         # Root package.json with npm workspaces
├── turbo.json          # Turborepo configuration
└── README.md           # This file
```

## Prerequisites

- **Node.js** (>=18.0.0)
- **npm** (>=10.0.0)
- **Python** (>=3.8)
- **Expo CLI** (for mobile development)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies for backend:**
   ```bash
   cd services/backend
   pip install -r requirements.txt
   cd ../..
   ```

## Running the Applications

### Frontend Only

To run just the React Native frontend:

```bash
# Using Turborepo
npm run dev:frontend

# Or directly in the frontend directory
cd app/native
npm run dev
```

This will start the Expo development server. You can then:
- Press `w` to open in web browser
- Press `a` to open Android emulator
- Press `i` to open iOS simulator
- Scan QR code with Expo Go app on your phone

### Backend Only

To run just the Python backend:

```bash
# Using Turborepo
npm run dev:backend

# Or directly in the backend directory
cd services/backend
python main.py
```

The backend API will be available at `http://localhost:8000`

### Both Together (Recommended)

To run both frontend and backend simultaneously:

```bash
npm run dev:all
```

This will start both services in parallel using Turborepo's task orchestration.

## Other Available Commands

### Build

```bash
# Build frontend (backend has no build step)
npm run build

# Build frontend only
npm run build:frontend
```

### Linting

```bash
# Run linting on all projects
npm run lint

# Run linting on frontend only
npm run lint:frontend
```

### Testing

```bash
# Run tests on all projects (if available)
npm run test
```

### Clean

```bash
# Clean build artifacts and caches
npm run clean
```

### Code Formatting

```bash
# Format all code (frontend + backend)
npm run format

# Check formatting without making changes
npm run format:check

# Format only frontend
npm run format:frontend

# Format only backend
npm run format:backend
```

**Formatting Configuration:**
- **Frontend (TypeScript/JavaScript)**: Uses Prettier with 2-space indentation
- **Backend (Python)**: Uses Black + isort with 4-space indentation (Python standard)
- **Consistent**: Line length of 100 characters across both projects
- **Automated**: Integrated with Turborepo for monorepo-wide formatting

**Frontend Formatting Rules:**
- 2-space indentation (tabWidth: 2)
- Single quotes for strings
- Trailing commas where valid
- 100 character line length
- Automatic semicolon insertion

**Backend Formatting Rules:**
- 4-space indentation (Python standard)
- 100 character line length
- Import sorting with isort
- Black code formatting
- Type checking with mypy

### Network IP Configuration

```bash
# Update network IP for local network access (mobile devices)
npm run update-ip
```

This cross-platform script automatically:
- **Detects your current network IP address** on Windows, Linux, and macOS
- **Updates the frontend configuration** to use the network IP
- **Ensures the backend is accessible** from mobile devices on the same network
- **Provides test URLs and next steps** for verification

**Cross-Platform Support:**
- **Windows**: Uses `ipconfig` and PowerShell commands
- **Linux**: Uses `ifconfig` and `ip addr` commands
- **macOS**: Uses `ifconfig` command
- **Fallback**: Python socket methods for any OS

**Use this when:**
- You want to test the app on a physical mobile device
- Your mobile device can't access `localhost` from the computer
- You're developing on a local network and need cross-device access
- You're switching between different networks (home, office, etc.)

**Features:**
- Prioritizes common local network ranges (192.168.x.x)
- Validates IP addresses before updating configurations
- Handles multiple network adapters intelligently
- Provides detailed system information for troubleshooting

## Development Workflow

1. **Start development servers:**
   ```bash
   npm run dev:all
   ```

2. **Make changes** to either frontend (`app/native/`) or backend (`services/backend/`)

3. **The applications will automatically reload** when you save changes

## Project Independence

Each project can still be run independently:

- **Frontend:** Navigate to `app/native/` and use standard Expo commands
- **Backend:** Navigate to `services/backend/` and run `python main.py`

The Turborepo setup is additive and doesn't change how individual projects work.

## Turborepo Benefits

- **Parallel execution:** Run multiple tasks simultaneously
- **Smart caching:** Skip redundant work across builds
- **Task dependencies:** Ensure proper build order
- **Unified interface:** Single commands to control the entire monorepo

## Troubleshooting

### Frontend Issues
- Ensure Expo CLI is installed: `npm install -g @expo/cli`
- Clear Expo cache: `cd app/native && npx expo start --clear`

### Backend Issues
- Ensure Python dependencies are installed: `cd services/backend && pip install -r requirements.txt`
- Check Python version: `python --version` (should be >=3.8)

### Monorepo Issues
- Clear Turborepo cache: `npx turbo clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

1. Make changes in the appropriate directory (`app/native/` or `services/backend/`)
2. Test your changes using `npm run dev:all`
3. Run linting with `npm run lint`
4. Submit your pull request

For more information about Turborepo, visit: https://turbo.build/repo/docs
