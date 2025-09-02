#!/usr/bin/env python3
"""
Network IP Configuration Script for Safe Wave
Automatically detects network IP and updates both backend and frontend configurations
"""

import os
import platform
import re
import socket
import subprocess
import sys
from pathlib import Path


def get_network_ip():
    """Get the current network IP address using cross-platform methods"""
    system = platform.system().lower()
    print(f"🖥️  Detected OS: {platform.system()}")

    # Method 1: Try socket method first (works on all platforms)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if is_private_ip(ip):
            print(f"🌐 Found network IP via socket: {ip}")
            return ip
        else:
            print(f"⚠️  Socket method returned public IP: {ip}, trying other methods...")
    except Exception as e:
        print(f"⚠️  Error getting IP via socket: {e}")

    # Method 2: Platform-specific network interface commands
    if system == "windows":
        return get_ip_windows()
    elif system in ["linux", "darwin"]:  # darwin is macOS
        return get_ip_unix()
    else:
        print(f"⚠️  Unsupported OS: {system}")

    # Method 3: Python's built-in socket methods as final fallback
    return get_ip_fallback()


def is_private_ip(ip):
    """Check if IP address is in private ranges"""
    if not ip:
        return False

    # Private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    return (
        ip.startswith("192.168.")
        or ip.startswith("10.")
        or (ip.startswith("172.") and 16 <= int(ip.split(".")[1]) <= 31)
    )


def get_ip_windows():
    """Get network IP on Windows using ipconfig"""
    try:
        print("🔍 Using Windows ipconfig method...")

        # Try different encodings for Windows
        encodings = ["utf-8", "cp1252", "cp850", "latin1"]
        result = None

        for encoding in encodings:
            try:
                result = subprocess.run(
                    ["ipconfig"], capture_output=True, text=True, encoding=encoding
                )
                if result.returncode == 0:
                    break
            except UnicodeDecodeError:
                continue

        if not result or result.returncode != 0:
            print("⚠️  Failed to run ipconfig command")
            return None

        lines = result.stdout.split("\n")

        # Look for IPv4 addresses, prioritizing 192.168.x.x
        found_ips = []
        current_adapter = ""

        for line in lines:
            line_stripped = line.strip()

            # Track current network adapter
            if "adapter" in line.lower() and ":" in line:
                current_adapter = line.strip()
                continue

            # Look for IPv4 addresses
            if any(keyword in line for keyword in ["IPv4 Address", "IP Address", "IPv4-Adresse"]):
                # Extract IP from lines like "   IPv4 Address. . . . . . . . . . . : 192.168.1.100"
                ip_match = re.search(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", line)
                if ip_match:
                    ip = ip_match.group(1)
                    if ip != "127.0.0.1" and is_private_ip(ip):
                        print(f"   📡 Found IP {ip} on {current_adapter}")
                        found_ips.append(ip)

        # Prioritize 192.168.x.x addresses
        for ip in found_ips:
            if ip.startswith("192.168."):
                print(f"🌐 Found network IP (Windows): {ip}")
                return ip

        # Return first private IP found
        if found_ips:
            ip = found_ips[0]
            print(f"🌐 Found network IP (Windows): {ip}")
            return ip

    except Exception as e:
        print(f"⚠️  Error getting IP via Windows ipconfig: {e}")

    # Try PowerShell as alternative
    try:
        print("🔍 Trying Windows PowerShell method...")
        ps_command = "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or ($_.IPAddress -like '172.*' -and [int]($_.IPAddress.Split('.')[1]) -ge 16 -and [int]($_.IPAddress.Split('.')[1]) -le 31)} | Select-Object -First 1 -ExpandProperty IPAddress"
        result = subprocess.run(
            ["powershell", "-Command", ps_command], capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout.strip():
            ip = result.stdout.strip()
            if is_private_ip(ip):
                print(f"🌐 Found network IP (PowerShell): {ip}")
                return ip
    except Exception as e:
        print(f"⚠️  Error with PowerShell method: {e}")

    return None


def get_ip_unix():
    """Get network IP on Unix-like systems (Linux/macOS) using ifconfig or ip"""
    # Try ifconfig first (available on most Unix systems)
    try:
        print("🔍 Using Unix ifconfig method...")
        result = subprocess.run(["ifconfig"], capture_output=True, text=True)
        if result.returncode == 0:
            return parse_unix_network_output(result.stdout, "ifconfig")
    except Exception as e:
        print(f"⚠️  Error with ifconfig: {e}")

    # Try 'ip addr' command (modern Linux)
    try:
        print("🔍 Using Linux 'ip addr' method...")
        result = subprocess.run(["ip", "addr"], capture_output=True, text=True)
        if result.returncode == 0:
            return parse_unix_network_output(result.stdout, "ip")
    except Exception as e:
        print(f"⚠️  Error with 'ip addr': {e}")

    return None


def parse_unix_network_output(output, command_type):
    """Parse network command output to find IP addresses"""
    lines = output.split("\n")
    found_ips = []

    for line in lines:
        line = line.strip()

        if command_type == "ifconfig":
            # Parse ifconfig output: "inet 192.168.1.100 netmask ..."
            if "inet " in line and "127.0.0.1" not in line:
                parts = line.split()
                if len(parts) >= 2:
                    ip = parts[1]
                    if is_private_ip(ip):
                        found_ips.append(ip)

        elif command_type == "ip":
            # Parse 'ip addr' output: "inet 192.168.1.100/24 ..."
            if "inet " in line and "127.0.0.1" not in line:
                ip_match = re.search(r"inet (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", line)
                if ip_match:
                    ip = ip_match.group(1)
                    if is_private_ip(ip):
                        found_ips.append(ip)

    # Prioritize 192.168.x.x addresses
    for ip in found_ips:
        if ip.startswith("192.168."):
            print(f"🌐 Found network IP (Unix): {ip}")
            return ip

    # Return first private IP found
    if found_ips:
        ip = found_ips[0]
        print(f"🌐 Found network IP (Unix): {ip}")
        return ip

    return None


def get_ip_fallback():
    """Fallback method using Python's socket module"""
    try:
        print("🔍 Using Python socket fallback method...")
        # Get all possible local IP addresses
        hostname = socket.gethostname()
        ip_list = socket.gethostbyname_ex(hostname)[2]

        # Filter for private IPs
        private_ips = [ip for ip in ip_list if is_private_ip(ip)]

        # Prioritize 192.168.x.x
        for ip in private_ips:
            if ip.startswith("192.168."):
                print(f"🌐 Found network IP (fallback): {ip}")
                return ip

        # Return first private IP
        if private_ips:
            ip = private_ips[0]
            print(f"🌐 Found network IP (fallback): {ip}")
            return ip

    except Exception as e:
        print(f"⚠️  Error with fallback method: {e}")

    print("❌ Could not determine network IP address")
    return None


def is_valid_ip(ip):
    """Validate IP address format"""
    if not ip:
        return False

    import re

    pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    if not re.match(pattern, ip):
        return False

    parts = ip.split(".")
    return all(0 <= int(part) <= 255 for part in parts)


def update_frontend_config(new_ip):
    """Update the frontend config.ts file with the new IP address"""
    try:
        # Get the project root directory (go up from services/backend/scripts)
        current_dir = Path(__file__).parent  # scripts folder
        backend_dir = current_dir.parent  # backend folder
        services_dir = backend_dir.parent  # services folder
        project_root = services_dir.parent  # project root
        config_path = project_root / "app" / "native" / "services" / "config.ts"

        if not config_path.exists():
            print(f"❌ Frontend config file not found: {config_path}")
            return False

        # Read the current config
        with open(config_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace all IP addresses in the config
        import re

        # Pattern to match IP addresses (but not localhost or 127.0.0.1)
        ip_pattern = r"(?<!127\.0\.0\.)\b(?:\d{1,3}\.){3}\d{1,3}(?=:9000)"

        # Count replacements to verify we're updating the right things
        old_ips = re.findall(ip_pattern, content)
        if old_ips:
            print(f"� Replacing IP addresses: {', '.join(set(old_ips))} → {new_ip}")

        # Replace all matching IP addresses with the new one
        updated_content = re.sub(ip_pattern, new_ip, content)

        # Write the updated content back
        with open(config_path, "w", encoding="utf-8") as f:
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


def print_system_info():
    """Print system information for debugging"""
    print(f"🖥️  Operating System: {platform.system()} {platform.release()}")
    print(f"🐍 Python Version: {platform.python_version()}")
    print(f"💻 Architecture: {platform.machine()}")
    print(f"🏠 Hostname: {socket.gethostname()}")


def main():
    """Main function to update network configuration"""
    print("🔍 Safe Wave Network IP Configuration")
    print("=" * 50)

    # Print system information
    print_system_info()
    print()

    # Get the current network IP
    print("🔍 Detecting network IP address...")
    ip = get_network_ip()

    if not ip:
        print("\n❌ Could not determine network IP address")
        print("💡 Troubleshooting tips:")
        print("   • Make sure you are connected to a network (WiFi or Ethernet)")
        print("   • Check if your firewall is blocking network access")
        print("   • Try running the script as administrator (Windows) or with sudo (Linux/macOS)")
        print("   • Ensure your network adapter is properly configured")
        sys.exit(1)

    if not is_valid_ip(ip):
        print(f"❌ Invalid IP address format: {ip}")
        print("💡 The detected IP address doesn't appear to be valid")
        sys.exit(1)

    print(f"\n🌐 Detected network IP: {ip}")

    # Validate that this is a private IP (for local development)
    if not is_private_ip(ip):
        print(f"⚠️  Warning: {ip} appears to be a public IP address")
        print(
            "💡 For local development, you typically want a private IP (192.168.x.x, 10.x.x.x, or 172.16-31.x.x)"
        )
        response = input("Do you want to continue anyway? (y/N): ")
        if response.lower() != "y":
            print("❌ Operation cancelled")
            sys.exit(0)

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
        print("💡 Check the error messages above for details")
        sys.exit(1)


if __name__ == "__main__":
    main()
