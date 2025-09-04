# Safe Wave Port Killer Script - PowerShell
# Usage: .\scripts\kill_port.ps1 [port] [-Force] [-All] [-List]

param(
    [int]$Port = 9000,
    [switch]$Force,
    [switch]$All,
    [switch]$List,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Safe Wave Port Killer - PowerShell Edition

Usage: .\scripts\kill_port.ps1 [OPTIONS]

Parameters:
    -Port <number>    Port number to kill processes on (default: 9000)
    -Force            Force kill processes without confirmation
    -All              Kill processes on all common backend ports
    -List             List processes on ports without killing them
    -Help             Show this help message

Examples:
    .\scripts\kill_port.ps1                     # Kill default backend port (9000)
    .\scripts\kill_port.ps1 -Port 8000          # Kill specific port
    .\scripts\kill_port.ps1 -All                # Kill all common backend ports
    .\scripts\kill_port.ps1 -List               # List processes on common ports
    .\scripts\kill_port.ps1 -Port 9000 -Force   # Force kill with no confirmation

Common use cases:
    - Backend port is stuck after a crash
    - Docker containers aren't releasing ports properly
    - Development server is stuck and won't restart
"@ -ForegroundColor Green
    exit 0
}

# Common backend ports
$CommonPorts = @(9000, 8000, 5000, 3000, 8080, 5432)

Write-Host "🔍 Safe Wave Port Killer" -ForegroundColor Blue

# Function to find processes on a specific port
function Get-ProcessesOnPort {
    param([int]$PortNumber)
    
    try {
        $netstatOutput = netstat -ano | Select-String ":$PortNumber\s" | Select-String "LISTENING"
        $processes = @()
        
        foreach ($line in $netstatOutput) {
            $parts = $line.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
            if ($parts.Length -ge 5) {
                $pid = $parts[-1]
                
                try {
                    $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($processInfo) {
                        $processes += [PSCustomObject]@{
                            PID = $pid
                            Name = $processInfo.ProcessName
                            Path = try { $processInfo.MainModule.FileName } catch { "Unknown" }
                            CPU = try { [math]::Round($processInfo.CPU, 2) } catch { 0 }
                            Memory = try { [math]::Round($processInfo.WorkingSet / 1MB, 2) } catch { 0 }
                        }
                    }
                } catch {
                    # Process might have exited, add basic info
                    $processes += [PSCustomObject]@{
                        PID = $pid
                        Name = "Unknown"
                        Path = "Unknown"
                        CPU = 0
                        Memory = 0
                    }
                }
            }
        }
        
        return $processes
    } catch {
        Write-Host "⚠️  Error finding processes on port $PortNumber : $($_.Exception.Message)" -ForegroundColor Yellow
        return @()
    }
}

# Function to kill a specific process
function Stop-ProcessByPID {
    param(
        [string]$ProcessID,
        [bool]$ForceKill = $false
    )
    
    try {
        if ($ForceKill) {
            taskkill /F /PID $ProcessID 2>$null | Out-Null
        } else {
            taskkill /PID $ProcessID 2>$null | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            return $true
        } else {
            return $false
        }
    } catch {
        return $false
    }
}

# Function to kill processes on a specific port
function Stop-ProcessesOnPort {
    param(
        [int]$PortNumber,
        [bool]$ForceKill = $false,
        [bool]$SkipConfirmation = $false
    )
    
    Write-Host "🔍 Searching for processes on port $PortNumber..." -ForegroundColor Yellow
    
    $processes = Get-ProcessesOnPort -PortNumber $PortNumber
    
    if ($processes.Count -eq 0) {
        Write-Host "✅ No processes found on port $PortNumber" -ForegroundColor Green
        return $true
    }
    
    Write-Host "📋 Found $($processes.Count) process(es) on port $PortNumber" -ForegroundColor Red
    foreach ($proc in $processes) {
        $memStr = if ($proc.Memory -gt 0) { "$($proc.Memory) MB" } else { "Unknown" }
        $cpuStr = if ($proc.CPU -gt 0) { "$($proc.CPU)%" } else { "Unknown" }
        Write-Host "   PID $($proc.PID): $($proc.Name) (Memory: $memStr, CPU: $cpuStr)" -ForegroundColor White
        if ($proc.Path -ne "Unknown") {
            Write-Host "     Path: $($proc.Path)" -ForegroundColor Gray
        }
    }
    
    # Ask for confirmation unless force or skip is specified
    if (-not $SkipConfirmation -and -not $ForceKill) {
        Write-Host ""
        $response = Read-Host "❓ Kill $($processes.Count) process(es)? [y/N]"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
            return $false
        }
    }
    
    Write-Host "🔫 Killing processes..." -ForegroundColor Blue
    $success = $true
    
    foreach ($proc in $processes) {
        $killed = Stop-ProcessByPID -ProcessID $proc.PID -ForceKill $ForceKill
        
        if ($killed) {
            Write-Host "✅ Killed process $($proc.PID) ($($proc.Name))" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to kill process $($proc.PID) ($($proc.Name))" -ForegroundColor Red
            $success = $false
        }
    }
    
    return $success
}

# Function to list processes on multiple ports
function Show-ProcessesOnPorts {
    param([int[]]$Ports)
    
    Write-Host "📋 Checking processes on common backend ports..." -ForegroundColor Blue
    Write-Host ""
    
    $foundAny = $false
    foreach ($portNum in $Ports) {
        $processes = Get-ProcessesOnPort -PortNumber $portNum
        
        if ($processes.Count -gt 0) {
            $foundAny = $true
            Write-Host "🔴 Port $portNum" -ForegroundColor Red
            foreach ($proc in $processes) {
                $memStr = if ($proc.Memory -gt 0) { "$($proc.Memory) MB" } else { "Unknown" }
                Write-Host "   PID $($proc.PID): $($proc.Name) (Memory: $memStr)" -ForegroundColor White
            }
            Write-Host ""
        } else {
            Write-Host "🟢 Port $portNum : Available" -ForegroundColor Green
        }
    }
    
    if (-not $foundAny) {
        Write-Host ""
        Write-Host "✅ All checked ports are available!" -ForegroundColor Green
    }
}

# Main logic
try {
    if ($List) {
        Show-ProcessesOnPorts -Ports $CommonPorts
    } elseif ($All) {
        Write-Host "🧹 Cleaning up all common backend ports..." -ForegroundColor Yellow
        Write-Host ""
        
        $overallSuccess = $true
        foreach ($portNum in $CommonPorts) {
            $success = Stop-ProcessesOnPort -PortNumber $portNum -ForceKill $Force -SkipConfirmation $Force
            if (-not $success) {
                $overallSuccess = $false
            }
            Write-Host ""
        }
        
        if ($overallSuccess) {
            Write-Host "🎉 All ports cleaned successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Some processes could not be killed" -ForegroundColor Yellow
            Write-Host "💡 Try running with -Force or with administrator privileges" -ForegroundColor Cyan
            exit 1
        }
    } else {
        $success = Stop-ProcessesOnPort -PortNumber $Port -ForceKill $Force -SkipConfirmation $Force
        
        if ($success) {
            Write-Host ""
            Write-Host "🎉 Port $Port is now available!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "⚠️  Some processes could not be killed" -ForegroundColor Yellow
            Write-Host "💡 Try running with -Force or with administrator privileges" -ForegroundColor Cyan
            exit 1
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running PowerShell as Administrator" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "💡 Windows-specific tips:" -ForegroundColor Magenta
Write-Host "   - Use Task Manager for detailed process information" -ForegroundColor White
Write-Host "   - Run PowerShell as Administrator for better permissions" -ForegroundColor White
Write-Host "   - Use 'netstat -ano' to manually check port usage" -ForegroundColor White

exit 0