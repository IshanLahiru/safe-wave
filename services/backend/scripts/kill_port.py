#!/usr/bin/env python3
"""
Port Process Killer Script for Safe Wave Backend

This script helps kill processes that are hogging ports, which is super useful
when your backend crashes and leaves processes running, or when Docker doesn't
clean up properly.

Usage:
    python scripts/kill_port.py                    # Kill default backend port (9000)
    python scripts/kill_port.py 8000               # Kill specific port
    python scripts/kill_port.py --all              # Kill all common backend ports
    python scripts/kill_port.py --list             # List processes on common ports
    python scripts/kill_port.py 9000 --force       # Force kill with SIGKILL

Common use cases:
    - Backend port is stuck after a crash
    - Docker containers aren't releasing ports properly
    - Development server is stuck and won't restart
    - Multiple processes are fighting for the same port
"""

import argparse
import os
import platform
import signal
import subprocess
import sys
from typing import List, Dict, Optional


class PortKiller:
    """Handles killing processes on ports for different operating systems"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.common_ports = [9000, 8000, 5000, 3000, 8080, 5432]  # Backend, dev servers, postgres
        
    def find_processes_on_port(self, port: int) -> List[Dict[str, str]]:
        """Find all processes that are using a specific port"""
        processes = []
        
        try:
            if self.system == "darwin" or self.system == "linux":
                # Use lsof command for macOS and Linux
                result = subprocess.run(
                    ["lsof", "-ti", f":{port}"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    
                    for pid in pids:
                        if pid.strip():
                            process_info = self._get_process_info(pid.strip())
                            if process_info:
                                processes.append(process_info)
                                
            elif self.system == "windows":
                # Use netstat command for Windows
                result = subprocess.run(
                    ["netstat", "-ano"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0:
                    lines = result.stdout.split('\n')
                    for line in lines:
                        if f":{port}" in line and "LISTENING" in line:
                            parts = line.split()
                            if len(parts) >= 5:
                                pid = parts[-1]
                                process_info = self._get_process_info(pid)
                                if process_info:
                                    processes.append(process_info)
                                    
        except subprocess.TimeoutExpired:
            print(f"⚠️  Timeout while searching for processes on port {port}")
        except FileNotFoundError:
            print(f"⚠️  Required system tools not found for {self.system}")
        except Exception as e:
            print(f"⚠️  Error finding processes on port {port}: {e}")
            
        return processes
    
    def _get_process_info(self, pid: str) -> Optional[Dict[str, str]]:
        """Get detailed information about a process."""
        try:
            if self.system == "windows":
                result = subprocess.run(
                    ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    lines = result.stdout.strip().split('\n')
                    if len(lines) > 1:
                        # Parse CSV output
                        data = lines[1].replace('"', '').split(',')
                        if len(data) >= 2:
                            return {
                                'pid': pid,
                                'name': data[0],
                                'command': data[0]
                            }
            else:
                # macOS and Linux
                result = subprocess.run(
                    ["ps", "-p", pid, "-o", "pid,comm,command"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    lines = result.stdout.strip().split('\n')
                    if len(lines) > 1:
                        parts = lines[1].split(None, 2)
                        if len(parts) >= 2:
                            return {
                                'pid': pid,
                                'name': parts[1],
                                'command': parts[2] if len(parts) > 2 else parts[1]
                            }
                            
        except Exception as e:
            print(f"⚠️  Error getting process info for PID {pid}: {e}")
            
        return None
    
    def kill_processes_on_port(self, port: int, force: bool = False) -> bool:
        """Kill all processes using the specified port."""
        print(f"🔍 Searching for processes on port {port}...")
        
        processes = self.find_processes_on_port(port)
        
        if not processes:
            print(f"✅ No processes found on port {port}")
            return True
            
        print(f"📋 Found {len(processes)} process(es) on port {port}:")
        for proc in processes:
            print(f"   PID {proc['pid']}: {proc['name']} - {proc['command']}")
            
        # Ask for confirmation unless force is specified
        if not force:
            response = input(f"\n❓ Kill {len(processes)} process(es)? [y/N]: ").lower()
            if response not in ['y', 'yes']:
                print("❌ Operation cancelled")
                return False
                
        success = True
        for proc in processes:
            if self._kill_process(proc['pid'], force):
                print(f"✅ Killed process {proc['pid']} ({proc['name']})")
            else:
                print(f"❌ Failed to kill process {proc['pid']} ({proc['name']})")
                success = False
                
        return success
    
    def _kill_process(self, pid: str, force: bool = False) -> bool:
        """Kill a specific process by PID."""
        try:
            pid_int = int(pid)
            
            if self.system == "windows":
                # Windows
                cmd = ["taskkill", "/F" if force else "", "/PID", pid]
                cmd = [x for x in cmd if x]  # Remove empty strings
                result = subprocess.run(cmd, capture_output=True, timeout=10)
                return result.returncode == 0
            else:
                # macOS and Linux
                sig = signal.SIGKILL if force else signal.SIGTERM
                os.kill(pid_int, sig)
                return True
                
        except ProcessLookupError:
            # Process already dead
            return True
        except PermissionError:
            print(f"⚠️  Permission denied killing process {pid}. Try running with sudo/admin privileges.")
            return False
        except Exception as e:
            print(f"⚠️  Error killing process {pid}: {e}")
            return False
    
    def list_processes_on_ports(self, ports: List[int]) -> None:
        """List all processes running on the specified ports."""
        print("📋 Checking processes on common backend ports...\n")
        
        found_any = False
        for port in ports:
            processes = self.find_processes_on_port(port)
            
            if processes:
                found_any = True
                print(f"🔴 Port {port}:")
                for proc in processes:
                    print(f"   PID {proc['pid']}: {proc['name']} - {proc['command']}")
                print()
            else:
                print(f"🟢 Port {port}: Available")
                
        if not found_any:
            print("✅ All checked ports are available!")
    
    def kill_all_backend_ports(self, force: bool = False) -> bool:
        """Kill processes on all common backend ports."""
        print("🧹 Cleaning up all common backend ports...")
        
        success = True
        for port in self.common_ports:
            if not self.kill_processes_on_port(port, force):
                success = False
                
        return success


def main():
    """CLI interface for the port killer."""
    parser = argparse.ArgumentParser(
        description="Kill processes running on specific ports",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/kill_port.py                    # Kill default backend port (9000)
  python scripts/kill_port.py 8000               # Kill specific port
  python scripts/kill_port.py --all              # Kill all common backend ports
  python scripts/kill_port.py --list             # List processes on common ports
  python scripts/kill_port.py 9000 --force       # Force kill with SIGKILL
  python scripts/kill_port.py --list --ports 3000 8000 9000  # Check specific ports
        """
    )
    
    parser.add_argument(
        "port",
        nargs="?",
        type=int,
        default=9000,
        help="Port number to kill processes on (default: 9000)"
    )
    
    parser.add_argument(
        "--all",
        action="store_true",
        help="Kill processes on all common backend ports"
    )
    
    parser.add_argument(
        "--list",
        action="store_true",
        help="List processes on ports without killing them"
    )
    
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force kill processes without confirmation (SIGKILL on Unix)"
    )
    
    parser.add_argument(
        "--ports",
        nargs="+",
        type=int,
        help="Specific ports to check when using --list"
    )
    
    args = parser.parse_args()
    
    killer = PortKiller()
    
    try:
        if args.list:
            ports = args.ports if args.ports else killer.common_ports
            killer.list_processes_on_ports(ports)
        elif args.all:
            success = killer.kill_all_backend_ports(args.force)
            sys.exit(0 if success else 1)
        else:
            success = killer.kill_processes_on_port(args.port, args.force)
            sys.exit(0 if success else 1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
