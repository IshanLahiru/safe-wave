# 🌐 Network Setup - Quick Reference

## 🚀 Quick Commands

```bash
# 1. Setup network access (one-time)
npm run network:setup

# 2. Start backend on network
npm run backend:network

# 3. Start frontend (in another terminal)
npm run frontend:dev

# 4. Connect mobile device using the displayed IP
```

## 📱 What You Get

After running `npm run network:setup`, your Safe Wave app will be accessible from:

- **Your Computer**: `http://localhost:9000`
- **Mobile Devices**: `http://YOUR_IP:9000` (e.g., `http://192.168.31.14:9000`)
- **API Documentation**: `http://YOUR_IP:9000/docs`
- **Health Check**: `http://YOUR_IP:9000/health`

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run network:ip` | Show your local network IP |
| `npm run network:setup` | Configure all files for network access |
| `npm run backend:network` | Start backend accessible from network |
| `npm run dev:network` | Setup + start backend in one command |

## 📋 Troubleshooting

### Backend won't start on network
```bash
# Re-detect IP and update configs
npm run network:setup

# Check if port 9000 is available
lsof -i :9000

# Try starting manually
cd apps/backend && python start-network.py
```

### Mobile device can't connect
1. ✅ Both devices on same WiFi network
2. ✅ Firewall allows port 9000
3. ✅ Test from mobile browser: `http://YOUR_IP:9000/health`

### Frontend still uses localhost
```bash
# Force update frontend config
npm run network:frontend

# Check the updated config
cat apps/frontend/services/config.ts
```

## 🎯 Files Modified

When you run `npm run network:setup`, these files are automatically updated:

1. **Backend Config**: `apps/backend/app/core/config.py`
   - Updates `HOST` to your network IP
   
2. **Frontend Config**: `apps/frontend/services/config.ts`
   - Updates `API_BASE_URL` to your network IP
   
3. **Network Script**: `apps/backend/start-network.py`
   - Creates optimized startup script for network access

## 💡 Pro Tips

- **Bookmark**: `http://YOUR_IP:9000/docs` for API documentation
- **QR Code**: Expo will show QR code with network URL
- **Same WiFi**: Ensure all devices are on the same network
- **Firewall**: Add exception for port 9000 if needed

## 🔒 Security Note

This setup is for **development only**. The backend becomes accessible to anyone on your local network. Never use this configuration in production without proper security measures.

---

For detailed documentation, see `NETWORK_SETUP.md`
