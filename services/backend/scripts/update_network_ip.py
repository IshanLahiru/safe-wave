#!/usr/bin/env python3
"""
Network IP Configuration Script for Safe Wave
Automatically detects network IP and updates both backend and frontend configurations
"""

import socket
import subprocess
import sys
import os
import re
from pathlib import Path

def get_network_ip():
    """Get the current network IP address using multiple methods"""
    try:
        # Method 1: Using ifconfig (macOS/Linux) - prioritize 192.168.x.x
        result = subprocess.run(['ifconfig'], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            # First pass: look for 192.168.x.x addresses (most common for local networks)
            for line in lines:
                if 'inet ' in line and '127.0.0.1' not in line:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        ip = parts[1]
                        if ip.startswith('192.168.'):
                            print(f"🌐 Found network IP: {ip}")
                            return ip

            # Second pass: look for other private IP ranges
            for line in lines:
                if 'inet ' in line and '127.0.0.1' not in line:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        ip = parts[1]
                        if ip.startswith('10.') or ip.startswith('172.'):
                            print(f"🌐 Found network IP: {ip}")
                            return ip
    except Exception as e:
        print(f"⚠️  Error getting IP via ifconfig: {e}")

    try:
        # Method 2: Using socket as fallback
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        print(f"🌐 Found network IP via socket: {ip}")
        return ip
    except Exception as e:
        print(f"⚠️  Error getting IP via socket: {e}")

    print("❌ Could not determine network IP address")
    return None

def is_valid_ip(ip):
    """Validate IP address format"""
    if not ip:
        return False

    import re
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if not re.match(pattern, ip):
        return False

    parts = ip.split('.')
    return all(0 <= int(part) <= 255 for part in parts)


def update_frontend_config(new_ip):
    """Update the frontend config.ts file with the new IP address"""
    try:
        # Get the project root directory (go up from services/backend/scripts)
        current_dir = Path(__file__).parent  # scripts folder
        backend_dir = current_dir.parent     # backend folder
        services_dir = backend_dir.parent    # services folder
        project_root = services_dir.parent   # project root
        config_path = project_root / 'app' / 'native' / 'services' / 'config.ts'

        if not config_path.exists():
            print(f"❌ Frontend config file not found: {config_path}")
            return False

        # Read the current config
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace all IP addresses in the config
        import re
        # Pattern to match IP addresses (but not localhost or 127.0.0.1)
        ip_pattern = r'(?<!127\.0\.0\.)\b(?:\d{1,3}\.){3}\d{1,3}(?=:9000)'

        # Count replacements to verify we're updating the right things
        old_ips = re.findall(ip_pattern, content)
        if old_ips:
            print(f"� Replacing IP addresses: {', '.join(set(old_ips))} → {new_ip}")

        # Replace all matching IP addresses with the new one
        updated_content = re.sub(ip_pattern, new_ip, content)

        # Write the updated content back
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"✅ Updated frontend config: {config_path}")
        return True

    except Exception as e:
        print(f"❌ Error updating frontend config: {e}")
        return False


def update_backend_host_config(new_ip):
    """Update backend configuration to bind to all interfaces"""
    try:
        # The backend should already be configured to bind to 0.0.0.0
        # This function can be extended if needed for specific backend config updates
        print(f"ℹ️  Backend is configured to bind to 0.0.0.0:9000 (accessible via {new_ip}:9000)")
        return True
    except Exception as e:
        print(f"❌ Error checking backend config: {e}")
        return False


def print_status_and_commands(ip):
    """Print the status and commands to start services"""
    if not ip:
        print("❌ No IP address available")
        return

    print(f"\n🎉 Network configuration updated successfully!")
    print(f"🌐 Network IP: {ip}")
    print(f"\n🚀 Backend Commands:")
    print(f"   cd services/backend")
    print(f"   python main.py")
    print(f"   # Backend will be accessible at: http://{ip}:9000")

    print(f"\n📱 Frontend Configuration:")
    print(f"   ✅ Config file updated automatically")
    print(f"   📁 File: app/native/services/config.ts")
    print(f"   🔗 Backend URL: http://{ip}:9000")

    print(f"\n🔗 Test URLs:")
    print(f"   🏥 Health Check: http://{ip}:9000/health/")
    print(f"   📊 Analytics: http://{ip}:9000/api/v1/analytics/test")
    print(f"   📚 API Docs: http://{ip}:9000/docs")

    print(f"\n💡 Next Steps:")
    print(f"   1. Start the backend server")
    print(f"   2. Test the health endpoint in your browser")
    print(f"   3. Start your React Native app")
    print(f"   4. The app should now connect to the backend automatically")

def main():
    """Main function to update network configuration"""
    print("🔍 Safe Wave Network IP Configuration")
    print("=" * 50)

    # Get the current network IP
    ip = get_network_ip()

    if not ip:
        print("❌ Could not determine network IP address")
        print("💡 Make sure you are connected to a network")
        sys.exit(1)

    if not is_valid_ip(ip):
        print(f"❌ Invalid IP address format: {ip}")
        sys.exit(1)

    print(f"\n🌐 Detected network IP: {ip}")

    # Update configurations
    success = True

    # Update frontend configuration
    print("\n📱 Updating frontend configuration...")
    if not update_frontend_config(ip):
        success = False

    # Check backend configuration
    print("\n🔧 Checking backend configuration...")
    if not update_backend_host_config(ip):
        success = False

    if success:
        print_status_and_commands(ip)
    else:
        print("\n❌ Some configuration updates failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
