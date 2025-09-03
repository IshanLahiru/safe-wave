#!/usr/bin/env python3
"""
Docker Container Management Script for Safe Wave Backend

This script provides programmatic Docker container management using the Docker SDK.
It can be used as a CLI tool or imported as a module for other scripts.

Usage:
    python scripts/docker_manager.py up
    python scripts/docker_manager.py down
    python scripts/docker_manager.py stop
    python scripts/docker_manager.py restart
    python scripts/docker_manager.py status
    python scripts/docker_manager.py logs [service_name]

Functions can also be imported:
    from scripts.docker_manager import up_container, down_container, etc.
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List, Optional

try:
    import docker
    from docker.errors import DockerException, NotFound
except ImportError:
    print("Error: Docker SDK not installed. Run: pip install docker")
    sys.exit(1)


class DockerManager:
    """Manages Docker containers for the Safe Wave backend services."""
    
    def __init__(self, compose_file: str = "docker-compose.yml"):
        """
        Initialize the Docker manager.
        
        Args:
            compose_file: Path to the docker-compose.yml file
        """
        self.compose_file = compose_file
        self.project_name = "backend"
        
        # Ensure we're in the correct directory
        script_dir = Path(__file__).parent
        self.backend_dir = script_dir.parent
        os.chdir(self.backend_dir)
        
        try:
            self.client = docker.from_env()
        except DockerException as e:
            print(f"Error connecting to Docker: {e}")
            print("Make sure Docker is running and accessible.")
            sys.exit(1)
    
    def _get_containers(self) -> List[docker.models.containers.Container]:
        """Get all containers for this project."""
        try:
            containers = self.client.containers.list(
                all=True,
                filters={"label": f"com.docker.compose.project={self.project_name}"}
            )
            return containers
        except DockerException as e:
            print(f"Error listing containers: {e}")
            return []
    
    def _run_compose_command(self, command: str) -> int:
        """Run a docker-compose command."""
        full_command = f"docker-compose {command}"
        print(f"Running: {full_command}")
        return os.system(full_command)
    
    def up_container(self, detached: bool = True, build: bool = False) -> bool:
        """
        Start the containers.
        
        Args:
            detached: Run in detached mode
            build: Force rebuild of images
            
        Returns:
            True if successful, False otherwise
        """
        print("🚀 Starting containers...")
        
        command = "up"
        if detached:
            command += " -d"
        if build:
            command += " --build"
        
        result = self._run_compose_command(command)
        
        if result == 0:
            print("✅ Containers started successfully!")
            return True
        else:
            print("❌ Failed to start containers")
            return False
    
    def down_container(self, remove_volumes: bool = False) -> bool:
        """
        Stop and remove containers.
        
        Args:
            remove_volumes: Also remove volumes
            
        Returns:
            True if successful, False otherwise
        """
        print("🛑 Stopping and removing containers...")
        
        command = "down"
        if remove_volumes:
            command += " -v"
        
        result = self._run_compose_command(command)
        
        if result == 0:
            print("✅ Containers stopped and removed successfully!")
            return True
        else:
            print("❌ Failed to stop containers")
            return False
    
    def stop_container(self) -> bool:
        """
        Stop containers without removing them.
        
        Returns:
            True if successful, False otherwise
        """
        print("⏸️  Stopping containers...")
        
        result = self._run_compose_command("stop")
        
        if result == 0:
            print("✅ Containers stopped successfully!")
            return True
        else:
            print("❌ Failed to stop containers")
            return False
    
    def restart_container(self) -> bool:
        """
        Restart containers.
        
        Returns:
            True if successful, False otherwise
        """
        print("🔄 Restarting containers...")
        
        result = self._run_compose_command("restart")
        
        if result == 0:
            print("✅ Containers restarted successfully!")
            return True
        else:
            print("❌ Failed to restart containers")
            return False
    
    def check_container_status(self) -> dict:
        """
        Check the status of all containers.
        
        Returns:
            Dictionary with container status information
        """
        print("📊 Checking container status...")
        
        containers = self._get_containers()
        status = {}
        
        if not containers:
            print("No containers found for this project.")
            return status
        
        print(f"\nFound {len(containers)} container(s):")
        print("-" * 80)
        print(f"{'NAME':<20} {'STATUS':<15} {'PORTS':<30} {'IMAGE':<20}")
        print("-" * 80)
        
        for container in containers:
            name = container.name
            status_text = container.status

            # Parse ports safely
            ports_list = []
            if container.ports:
                for port_key, port_mappings in container.ports.items():
                    if port_mappings:
                        for mapping in (port_mappings if isinstance(port_mappings, list) else [port_mappings]):
                            if mapping and 'HostPort' in mapping:
                                ports_list.append(f"{mapping['HostPort']}:{port_key}")
            ports = ", ".join(ports_list) if ports_list else "None"

            image = container.image.tags[0] if container.image.tags else container.image.id[:12]
            
            print(f"{name:<20} {status_text:<15} {ports:<30} {image:<20}")
            
            status[name] = {
                'status': status_text,
                'ports': ports,
                'image': image,
                'id': container.id
            }
        
        return status
    
    def show_logs(self, service: Optional[str] = None, follow: bool = True, tail: int = 100) -> bool:
        """
        Show container logs.
        
        Args:
            service: Specific service to show logs for (optional)
            follow: Follow log output
            tail: Number of lines to show from the end
            
        Returns:
            True if successful, False otherwise
        """
        print(f"📋 Showing logs{f' for {service}' if service else ''}...")
        
        command = "logs"
        if follow:
            command += " -f"
        command += f" --tail {tail}"
        if service:
            command += f" {service}"
        
        result = self._run_compose_command(command)
        return result == 0


# Convenience functions for direct import
def up_container(detached: bool = True, build: bool = False) -> bool:
    """Start containers."""
    return DockerManager().up_container(detached, build)


def down_container(remove_volumes: bool = False) -> bool:
    """Stop and remove containers."""
    return DockerManager().down_container(remove_volumes)


def stop_container() -> bool:
    """Stop containers without removing."""
    return DockerManager().stop_container()


def restart_container() -> bool:
    """Restart containers."""
    return DockerManager().restart_container()


def check_container_status() -> dict:
    """Check container status."""
    return DockerManager().check_container_status()


def show_logs(service: Optional[str] = None, follow: bool = True, tail: int = 100) -> bool:
    """Show container logs."""
    return DockerManager().show_logs(service, follow, tail)


def main():
    """CLI interface for Docker management."""
    parser = argparse.ArgumentParser(
        description="Docker Container Management for Safe Wave Backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/docker_manager.py up              # Start containers
  python scripts/docker_manager.py down            # Stop and remove containers
  python scripts/docker_manager.py stop            # Stop containers only
  python scripts/docker_manager.py restart         # Restart containers
  python scripts/docker_manager.py status          # Check container status
  python scripts/docker_manager.py logs            # Show all logs
  python scripts/docker_manager.py logs api        # Show API service logs only
        """
    )
    
    parser.add_argument(
        "command",
        choices=["up", "down", "stop", "restart", "status", "logs"],
        help="Docker management command to execute"
    )
    
    parser.add_argument(
        "service",
        nargs="?",
        help="Service name (for logs command)"
    )
    
    parser.add_argument(
        "--build",
        action="store_true",
        help="Force rebuild when starting containers"
    )
    
    parser.add_argument(
        "--volumes",
        action="store_true",
        help="Remove volumes when stopping containers"
    )
    
    parser.add_argument(
        "--no-follow",
        action="store_true",
        help="Don't follow logs (for logs command)"
    )
    
    args = parser.parse_args()
    
    manager = DockerManager()
    
    try:
        if args.command == "up":
            success = manager.up_container(build=args.build)
        elif args.command == "down":
            success = manager.down_container(remove_volumes=args.volumes)
        elif args.command == "stop":
            success = manager.stop_container()
        elif args.command == "restart":
            success = manager.restart_container()
        elif args.command == "status":
            manager.check_container_status()
            success = True
        elif args.command == "logs":
            success = manager.show_logs(
                service=args.service,
                follow=not args.no_follow
            )
        else:
            print(f"Unknown command: {args.command}")
            success = False
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
