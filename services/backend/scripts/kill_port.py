#!/usr/bin/env python3
"""
Enhanced Cross-Platform Port Process Killer Script for Safe Wave Backend

This script provides comprehensive port management with platform-specific optimizations
and integration with Poetry/Turborepo workflows.

Features:
    • Cross-platform process detection and management
    • Enhanced error handling and user feedback
    • Docker container integration
    • Batch port management
    • Safe process termination with fallback options
    • Integration with development workflows

Usage:
    python scripts/kill_port.py                    # Kill default backend port (9000)
    python scripts/kill_port.py 8000               # Kill specific port
    python scripts/kill_port.py --all              # Kill all common backend ports
    python scripts/kill_port.py --list             # List processes on common ports
    python scripts/kill_port.py 9000 --force       # Force kill with SIGKILL
    python scripts/kill_port.py --docker           # Kill Docker containers on ports
    python scripts/kill_port.py --interactive      # Interactive mode with process selection

Common use cases:
    - Backend port is stuck after a crash
    - Docker containers aren't releasing ports properly
    - Development server is stuck and won't restart
    - Multiple processes are fighting for the same port
    - Clean development environment setup
"""

import argparse
import json
import os
import platform
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union


class Colors:
    """ANSI color codes for cross-platform terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    
    @classmethod
    def disable_on_windows(cls):
        """Disable colors on Windows if not supported"""
        if platform.system() == "Windows" and not os.getenv("ANSICON"):
            for attr in dir(cls):
                if not attr.startswith('_'):
                    setattr(cls, attr, '')


class ProcessInfo:
    """Container for process information with enhanced details"""
    
    def __init__(self, pid: str, name: str = "Unknown",
                 command: str = "Unknown", port: int = 0,
                 cpu: float = 0.0, memory: float = 0.0,
                 user: str = "Unknown", status: str = "Unknown"):
        self.pid = pid
        self.name = name
        self.command = command
        self.port = port
        self.cpu = cpu
        self.memory = memory
        self.user = user
        self.status = status
        
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'pid': self.pid,
            'name': self.name,
            'command': self.command,
            'port': self.port,
            'cpu': self.cpu,
            'memory': self.memory,
            'user': self.user,
            'status': self.status
        }
        
    def __str__(self) -> str:
        return f"PID {self.pid}: {self.name} (Port: {self.port}, Memory: {self.memory:.1f}MB)"


class DockerIntegration:
    """Handle Docker container port management"""
    
    def __init__(self):
        self.docker_available = self._check_docker_availability()
        
    def _check_docker_availability(self) -> bool:
        """Check if Docker is available and running"""
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def get_containers_on_port(self, port: int) -> List[Dict[str, str]]:
        """Get Docker containers using a specific port"""
        if not self.docker_available:
            return []
            
        try:
            # Get all running containers
            result = subprocess.run(
                ["docker", "ps", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.returncode != 0:
                return []
                
            containers = []
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    try:
                        container = json.loads(line)
                        # Check if container exposes the port
                        ports = container.get('Ports', '')
                        if f"{port}/" in ports or f":{port}->" in ports:
                            containers.append({
                                'id': container.get('ID', '')[:12],
                                'name': container.get('Names', ''),
                                'image': container.get('Image', ''),
                                'ports': ports,
                                'status': container.get('Status', '')
                            })
                    except json.JSONDecodeError:
                        continue
                        
            return containers
            
        except Exception:
            return []
    
    def stop_containers_on_port(self, port: int, force: bool = False) -> Tuple[bool, List[str]]:
        """Stop Docker containers using a specific port"""
        containers = self.get_containers_on_port(port)
        if not containers:
            return True, []
            
        stopped = []
        for container in containers:
            try:
                cmd = ["docker", "stop" if not force else "kill", container['id']]
                result = subprocess.run(cmd, capture_output=True, timeout=30)
                if result.returncode == 0:
                    stopped.append(f"{container['name']} ({container['id']})")
            except Exception:
                continue
                
        return len(stopped) == len(containers), stopped


class EnhancedPortKiller:
    """Enhanced port process killer with cross-platform support"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.common_ports = [9000, 8000, 5000, 3000, 8080, 5432, 6379]  # Added Redis
        self.docker = DockerIntegration()
        
    def find_processes_on_port(self, port: int, include_docker: bool = True) -> List[ProcessInfo]:
        """Find all processes that are using a specific port with enhanced details"""
        processes = []
        
        try:
            if self.system in ["darwin", "linux"]:
                processes.extend(self._find_unix_processes(port))
            elif self.system == "windows":
                processes.extend(self._find_windows_processes(port))
                
            # Add Docker container information if requested
            if include_docker and self.docker.docker_available:
                docker_containers = self.docker.get_containers_on_port(port)
                for container in docker_containers:
                    processes.append(ProcessInfo(
                        pid=f"docker:{container['id']}",
                        name=f"Docker: {container['name']}",
                        command=f"Container: {container['image']}",
                        port=port,
                        status=container['status']
                    ))
                    
        except Exception as e:
            self._print_error(f"Error finding processes on port {port}: {e}")
            
        return processes
    
    def _find_unix_processes(self, port: int) -> List[ProcessInfo]:
        """Find processes on Unix-like systems (Linux/macOS)"""
        processes = []
        
        try:
            # Use lsof for more detailed information
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
                        process_info = self._get_detailed_process_info(pid.strip(), port)
                        if process_info:
                            processes.append(process_info)
                            
        except FileNotFoundError:
            # Fallback to netstat if lsof is not available
            processes.extend(self._find_unix_processes_netstat(port))
        except Exception as e:
            self._print_warning(f"Error using lsof: {e}")
            
        return processes
    
    def _find_unix_processes_netstat(self, port: int) -> List[ProcessInfo]:
        """Fallback method using netstat for Unix systems"""
        processes = []
        
        try:
            result = subprocess.run(
                ["netstat", "-tulnp"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if f":{port} " in line and "LISTEN" in line:
                        parts = line.split()
                        if len(parts) >= 7 and "/" in parts[-1]:
                            pid = parts[-1].split('/')[0]
                            if pid.isdigit():
                                process_info = self._get_detailed_process_info(pid, port)
                                if process_info:
                                    processes.append(process_info)
                                    
        except Exception as e:
            self._print_warning(f"Error using netstat fallback: {e}")
            
        return processes
    
    def _find_windows_processes(self, port: int) -> List[ProcessInfo]:
        """Find processes on Windows systems"""
        processes = []
        
        try:
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
                            if pid.isdigit():
                                process_info = self._get_detailed_process_info(pid, port)
                                if process_info:
                                    processes.append(process_info)
                                    
        except Exception as e:
            self._print_warning(f"Error finding Windows processes: {e}")
            
        return processes
    
    def _get_detailed_process_info(self, pid: str, port: int) -> Optional[ProcessInfo]:
        """Get detailed information about a process with enhanced cross-platform support"""
        try:
            if self.system == "windows":
                return self._get_windows_process_info(pid, port)
            else:
                return self._get_unix_process_info(pid, port)
        except Exception as e:
            self._print_warning(f"Error getting process info for PID {pid}: {e}")
            return None
    
    def _get_windows_process_info(self, pid: str, port: int) -> Optional[ProcessInfo]:
        """Get Windows process information with enhanced details"""
        try:
            # Get basic process info using tasklist first (more reliable)
            result = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    data = lines[1].replace('"', '').split(',')
                    if len(data) >= 5:
                        name = data[0]
                        memory_str = data[4].replace(',', '').replace(' K', '')
                        memory = float(memory_str) / 1024 if memory_str.isdigit() else 0.0  # Convert to MB
                        
                        return ProcessInfo(
                            pid=pid,
                            name=name,
                            command=name,  # Basic command info
                            port=port,
                            memory=memory
                        )
                        
        except Exception:
            pass
            
        return None
    
    def _get_unix_process_info(self, pid: str, port: int) -> Optional[ProcessInfo]:
        """Get Unix process information with enhanced details"""
        try:
            # Try to get detailed process information
            result = subprocess.run(
                ["ps", "-p", pid, "-o", "pid,comm,command,%cpu,%mem,user,stat"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    parts = lines[1].split(None, 6)
                    if len(parts) >= 6:
                        return ProcessInfo(
                            pid=pid,
                            name=parts[1],
                            command=parts[6] if len(parts) > 6 else parts[1],
                            port=port,
                            cpu=float(parts[3]) if parts[3].replace('.', '').isdigit() else 0.0,
                            memory=float(parts[4]) if parts[4].replace('.', '').isdigit() else 0.0,
                            user=parts[5],
                            status=parts[6] if len(parts) > 6 else "Running"
                        )
                        
        except Exception:
            pass
            
        return None
    
    def _print_success(self, message: str):
        """Print success message with color"""
        print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")
    
    def _print_error(self, message: str):
        """Print error message with color"""
        print(f"{Colors.RED}❌ {message}{Colors.RESET}")
    
    def _print_warning(self, message: str):
        """Print warning message with color"""
        print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")
    
    def _print_info(self, message: str):
        """Print info message with color"""
        print(f"{Colors.CYAN}ℹ️  {message}{Colors.RESET}")
    
    def _print_step(self, message: str):
        """Print step message with color"""
        print(f"{Colors.BLUE}🔧 {message}{Colors.RESET}")
    
    def kill_processes_on_port(self, port: int, force: bool = False, include_docker: bool = True) -> bool:
        """Kill all processes using the specified port with enhanced feedback"""
        self._print_step(f"Searching for processes on port {port}...")
        
        processes = self.find_processes_on_port(port, include_docker)
        
        if not processes:
            self._print_success(f"No processes found on port {port}")
            return True
            
        self._print_info(f"Found {len(processes)} process(es) on port {port}:")
        
        docker_processes = []
        regular_processes = []
        
        for proc in processes:
            if proc.pid.startswith("docker:"):
                docker_processes.append(proc)
            else:
                regular_processes.append(proc)
                
            # Enhanced process display
            mem_str = f"{proc.memory:.1f}MB" if proc.memory > 0 else "Unknown"
            cpu_str = f"{proc.cpu:.1f}%" if proc.cpu > 0 else "Unknown"
            
            print(f"   {proc}")
            if proc.user != "Unknown":
                print(f"     User: {proc.user}, CPU: {cpu_str}, Memory: {mem_str}")
            if len(proc.command) > 50:
                print(f"     Command: {proc.command[:50]}...")
            
        # Ask for confirmation unless force is specified
        if not force:
            response = input(f"\n❓ Kill {len(processes)} process(es)? [y/N]: ").lower()
            if response not in ['y', 'yes']:
                self._print_warning("Operation cancelled")
                return False
                
        success = True
        
        # Kill Docker containers first
        if docker_processes and include_docker:
            self._print_step("Stopping Docker containers...")
            docker_success, stopped_containers = self.docker.stop_containers_on_port(port, force)
            if docker_success:
                for container in stopped_containers:
                    self._print_success(f"Stopped Docker container: {container}")
            else:
                self._print_warning("Some Docker containers could not be stopped")
                success = False
        
        # Kill regular processes
        if regular_processes:
            self._print_step("Terminating processes...")
            for proc in regular_processes:
                if self._kill_process(proc.pid, force):
                    self._print_success(f"Killed process {proc.pid} ({proc.name})")
                else:
                    self._print_error(f"Failed to kill process {proc.pid} ({proc.name})")
                    success = False
                    
        return success
    
    def _kill_process(self, pid: str, force: bool = False) -> bool:
        """Kill a specific process by PID with enhanced error handling"""
        try:
            pid_int = int(pid)
            
            if self.system == "windows":
                return self._kill_windows_process(pid, force)
            else:
                return self._kill_unix_process(pid_int, force)
                
        except ValueError:
            self._print_error(f"Invalid PID: {pid}")
            return False
        except ProcessLookupError:
            # Process already dead
            return True
        except PermissionError:
            self._print_warning(f"Permission denied killing process {pid}. Try running with elevated privileges.")
            return False
        except Exception as e:
            self._print_warning(f"Error killing process {pid}: {e}")
            return False
    
    def _kill_windows_process(self, pid: str, force: bool = False) -> bool:
        """Kill Windows process with proper error handling"""
        try:
            cmd = ["taskkill", "/PID", pid]
            if force:
                cmd.append("/F")
                
            result = subprocess.run(cmd, capture_output=True, timeout=15, text=True)
            
            if result.returncode == 0:
                return True
            elif "Access is denied" in result.stderr:
                self._print_warning(f"Access denied for PID {pid}. Try running as Administrator.")
                return False
            else:
                self._print_warning(f"Failed to kill process {pid}: {result.stderr.strip()}")
                return False
                
        except subprocess.TimeoutExpired:
            self._print_warning(f"Timeout killing process {pid}")
            return False
        except Exception as e:
            self._print_warning(f"Error killing Windows process {pid}: {e}")
            return False
    
    def _kill_unix_process(self, pid: int, force: bool = False) -> bool:
        """Kill Unix process with proper signal handling"""
        try:
            sig = signal.SIGKILL if force else signal.SIGTERM
            os.kill(pid, sig)
            
            # Wait a moment and check if process is still alive
            if not force:
                time.sleep(0.5)
                try:
                    os.kill(pid, 0)  # Check if process exists
                    # Process still exists, try SIGKILL
                    time.sleep(1.5)
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass  # Process is dead, good
                    
            return True
            
        except ProcessLookupError:
            return True  # Process already dead
        except PermissionError:
            self._print_warning(f"Permission denied for PID {pid}. Try running with sudo.")
            return False
        except Exception as e:
            self._print_warning(f"Error killing Unix process {pid}: {e}")
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
                    mem_str = f"{proc.memory:.1f}MB" if proc.memory > 0 else "Unknown"
                    print(f"   PID {proc.pid}: {proc.name}")
                    if proc.user != "Unknown":
                        print(f"     User: {proc.user}, Memory: {mem_str}")
                    if len(proc.command) > 60:
                        print(f"     Command: {proc.command[:60]}...")
                    else:
                        print(f"     Command: {proc.command}")
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
            if not self.kill_processes_on_port(port, force, include_docker=True):
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
    
    # Disable colors on unsupported Windows terminals
    Colors.disable_on_windows()
    
    killer = EnhancedPortKiller()
    
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
