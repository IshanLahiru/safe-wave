# 🌐 Network Setup Guide - Access Safe Wave from Any Device

This guide explains how to configure Safe Wave to be accessible from any device on your local network (WiFi), not just the development machine.

## 🎯 Quick Start

### **1. Automatic Network Setup**
```bash
# Detect local IP and update all configurations
npm run network:setup

# Start backend on network IP
npm run backend:network

# Start frontend (in another terminal)
npm run frontend:dev
```

### **2. Manual IP Detection**
```bash
# Just show the local network IP
npm run network:ip

# Show IP only (for scripts)
npm run network:ip -- --ip-only
```

## 🔧 What the Network Setup Does

### **Automatic Configuration**
The `npm run network:setup` command:

1. **Detects Local IP**: Finds your computer's IP address on the local network
2. **Updates Backend Config**: Modifies `apps/backend/app/core/config.py` to use the network IP
3. **Updates Frontend Config**: Modifies `apps/frontend/services/config.ts` to point to the network IP
4. **Creates Network Script**: Generates `apps/backend/start-network.py` for easy network startup

### **Example Output**
```
🌐 Local Network IP: 192.168.1.100
📱 Backend will be accessible at: http://192.168.1.100:9000
📚 API docs will be at: http://192.168.1.100:9000/docs
🏥 Health check will be at: http://192.168.1.100:9000/health

🔧 Updating configuration files...

✅ Backend config updated: 192.168.1.100:9000
✅ Backend network script created: apps/backend/start-network.py
✅ Frontend config updated: http://192.168.1.100:9000

✨ Configuration update complete!

📋 Next steps:
   1. Start backend: npm run backend:network
   2. Start frontend: npm run frontend:dev
   3. Connect from mobile device using the IP above
   4. Make sure your mobile device is on the same WiFi network
```

## 📱 Available Commands

### **Root Level Commands**
```bash
# Network IP detection and configuration
npm run network:ip          # Show current local network IP
npm run network:setup       # Update all configs with network IP
npm run network:backend     # Update only backend config
npm run network:frontend    # Update only frontend config

# Start services on network
npm run backend:network     # Start backend accessible from network
npm run dev:network         # Setup network + start backend
```

### **Backend Commands**
```bash
cd apps/backend

# Start on network IP (after running network:setup)
npm run network
# or
python start-network.py
```

## 🏗️ How It Works

### **IP Detection Priority**
The script detects your local network IP using this priority:
1. **en0** (macOS WiFi)
2. **eth0** (Linux Ethernet)
3. **wlan0** (Linux WiFi)
4. **Wi-Fi** (Windows WiFi)
5. **Ethernet** (Windows Ethernet)
6. **Any non-internal IPv4** (fallback)

### **Configuration Updates**

#### **Backend Configuration**
Updates `apps/backend/app/core/config.py`:
```python
# Before
HOST: str = "0.0.0.0"
PORT: int = 9000

# After (example)
HOST: str = "192.168.1.100"
PORT: int = 9000
```

#### **Frontend Configuration**
Updates `apps/frontend/services/config.ts`:
```typescript
// Before
export const API_BASE_URL = 'http://localhost:9000';

// After (example)
export const API_BASE_URL = 'http://192.168.1.100:9000';
```

#### **Network Startup Script**
Creates `apps/backend/start-network.py`:
```python
import uvicorn
from app.main import app

if __name__ == "__main__":
    print("🚀 Starting Safe Wave Backend on network...")
    print(f"📱 Local Network URL: http://192.168.1.100:9000")
    # ... more startup info
    
    uvicorn.run(
        "app.main:app",
        host="192.168.1.100",
        port=9000,
        reload=True,
        log_level="info"
    )
```

## 📱 Mobile Device Setup

### **1. Ensure Same WiFi Network**
- Your development computer and mobile device must be on the same WiFi network
- Corporate networks may block device-to-device communication

### **2. Connect Mobile App**
After running `npm run network:setup`:

1. **Start Backend**: `npm run backend:network`
2. **Start Frontend**: `npm run frontend:dev`
3. **Open Expo Go** on your mobile device
4. **Scan QR Code** or enter the network URL manually

### **3. Verify Connection**
Test the backend connection from your mobile device's browser:
- Visit: `http://YOUR_IP:9000/health`
- Should show: `{"status": "healthy", ...}`

## 🔍 Troubleshooting

### **Common Issues**

#### **1. "Cannot connect to backend"**
```bash
# Check if backend is running on network IP
curl http://YOUR_IP:9000/health

# If not working, try:
npm run network:setup  # Re-detect IP
npm run backend:network  # Restart backend
```

#### **2. "IP detection failed"**
```bash
# Manual IP detection
npm run network:ip

# If shows 127.0.0.1, check network connection
# Try different network interface
```

#### **3. "Mobile device can't connect"**
- Ensure both devices are on same WiFi
- Check firewall settings
- Try disabling VPN
- Corporate networks may block connections

#### **4. "Frontend still uses localhost"**
```bash
# Force update frontend config
npm run network:frontend

# Check the config file
cat apps/frontend/services/config.ts
```

### **Manual Configuration**

If automatic setup fails, manually update:

#### **Backend** (`apps/backend/app/core/config.py`):
```python
HOST: str = "YOUR_NETWORK_IP"  # e.g., "192.168.1.100"
```

#### **Frontend** (`apps/frontend/services/config.ts`):
```typescript
export const API_BASE_URL = 'http://YOUR_NETWORK_IP:9000';
```

## 🔒 Security Considerations

### **Development Only**
- This setup is for **development only**
- Never use in production without proper security
- The backend will be accessible to anyone on your network

### **Firewall Settings**
- Your firewall may block incoming connections
- Add exception for port 9000 if needed
- Windows: Windows Defender Firewall
- macOS: System Preferences > Security & Privacy > Firewall

## 🚀 Advanced Usage

### **Custom Port**
To use a different port, update both:
1. `apps/backend/app/core/config.py`: `PORT: int = YOUR_PORT`
2. `scripts/get-local-ip.js`: Change default port in the script

### **Multiple Network Interfaces**
If you have multiple network interfaces, the script will choose the first available. To force a specific IP:

```bash
# Edit the script or manually update configs
node scripts/get-local-ip.js --help
```

### **Docker/Container Setup**
For containerized development:
1. Use `0.0.0.0` as host in container
2. Map container port to host network IP
3. Update frontend config to use host IP

## 📚 Related Documentation

- **Main Setup**: `README.md`
- **Backend Config**: `apps/backend/app/core/config.py`
- **Frontend Config**: `apps/frontend/services/config.ts`
- **Expo Documentation**: [Expo Development](https://docs.expo.dev/)

## 🤝 Contributing

If you improve the network setup script:
1. Test on different operating systems
2. Update this documentation
3. Add error handling for edge cases
4. Submit a pull request

---

**💡 Pro Tip**: Bookmark `http://YOUR_IP:9000/docs` for easy access to API documentation from any device on your network!
