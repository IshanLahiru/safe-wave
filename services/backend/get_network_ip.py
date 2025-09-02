#!/usr/bin/env python3
"""
Script to get the current network IP address
"""

import socket
import subprocess
import sys

def get_network_ip():
    """Get the current network IP address"""
    try:
        # Method 1: Using ifconfig (macOS/Linux) - prioritize 192.168.x.x
        result = subprocess.run(['ifconfig'], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            for line in lines:
                if 'inet ' in line and '127.0.0.1' not in line:
                    ip = line.strip().split()[1]
                    # Prioritize 192.168.x.x addresses for local development
                    if ip.startswith('192.168.'):
                        print(f"🌐 Network IP Address: {ip}")
                        return ip
            
            # Fallback to other private IP ranges
            for line in lines:
                if 'inet ' in line and '127.0.0.1' not in line:
                    ip = line.strip().split()[1]
                    if ip.startswith('10.') or ip.startswith('172.'):
                        print(f"🌐 Network IP Address: {ip}")
                        return ip
    except Exception as e:
        print(f"Error getting IP via ifconfig: {e}")
    
    try:
        # Method 2: Using socket as fallback
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        print(f"🌐 Network IP Address: {ip}")
        return ip
    except Exception as e:
        print(f"Error getting IP via socket: {e}")
    
    print("❌ Could not determine network IP address")
    return None

def print_backend_commands(ip):
    """Print the commands to start the backend with the correct IP"""
    if ip:
        print(f"\n🚀 Backend Commands:")
        print(f"cd services/backend")
        print(f"uvicorn main:app --host 0.0.0.0 --port 9000 --reload")
        print(f"\n📱 Frontend Configuration:")
        print(f"Update app/native/services/config.ts to use: http://{ip}:9000")
        print(f"\n🔗 Test URLs:")
        print(f"Health: http://{ip}:9000/health/")
        print(f"Analytics: http://{ip}:9000/api/v1/analytics/test")
        print(f"API Docs: http://{ip}:9000/docs")

if __name__ == "__main__":
    print("🔍 Finding your network IP address...")
    ip = get_network_ip()
    print_backend_commands(ip)
