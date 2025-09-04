@echo off
REM Safe Wave Port Killer Script - Batch File
REM Usage: kill_port.bat [port] [options]

setlocal enabledelayedexpansion

set "PORT=9000"
set "FORCE_MODE=0"
set "LIST_MODE=0"
set "ALL_MODE=0"

REM Parse command line arguments
:parse_args
if "%1"=="/?" goto show_help
if "%1"=="--help" goto show_help
if "%1"=="-help" goto show_help
if "%1"=="--force" set "FORCE_MODE=1"
if "%1"=="-force" set "FORCE_MODE=1"
if "%1"=="-f" set "FORCE_MODE=1"
if "%1"=="--list" set "LIST_MODE=1"
if "%1"=="-list" set "LIST_MODE=1"
if "%1"=="-l" set "LIST_MODE=1"
if "%1"=="--all" set "ALL_MODE=1"
if "%1"=="-all" set "ALL_MODE=1"
if "%1"=="-a" set "ALL_MODE=1"

REM Check if argument is a number (port)
echo %1| findstr /r "^[0-9][0-9]*$" >nul
if %errorlevel%==0 set "PORT=%1"

shift
if not "%1"=="" goto parse_args

echo.
echo 🔍 Safe Wave Port Killer
echo.

if "%LIST_MODE%"=="1" goto list_ports
if "%ALL_MODE%"=="1" goto kill_all_ports

REM Kill specific port
echo Checking port %PORT%...

REM Find processes using the port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    set "PID=%%a"
    if not "!PID!"=="" (
        echo Found process on port %PORT%: PID !PID!
        
        REM Get process name
        for /f "tokens=1" %%b in ('tasklist /fi "PID eq !PID!" /fo csv /nh ^| findstr /v "INFO:"') do (
            set "PROCESS_NAME=%%b"
            set "PROCESS_NAME=!PROCESS_NAME:"=!"
            echo   Process: !PROCESS_NAME! ^(PID: !PID!^)
        )
        
        if "%FORCE_MODE%"=="0" (
            set /p "confirm=❓ Kill process !PID! ^(!PROCESS_NAME!^)? (y/N): "
            if /i not "!confirm!"=="y" (
                echo ❌ Operation cancelled
                goto end
            )
        )
        
        echo 🔫 Killing process !PID!...
        if "%FORCE_MODE%"=="1" (
            taskkill /F /PID !PID! >nul 2>&1
        ) else (
            taskkill /PID !PID! >nul 2>&1
        )
        
        if !errorlevel!==0 (
            echo ✅ Killed process !PID! ^(!PROCESS_NAME!^)
            echo 🎉 Port %PORT% is now available!
        ) else (
            echo ❌ Failed to kill process !PID!
            echo 💡 Try running as Administrator or use --force
            exit /b 1
        )
        goto end
    )
)

echo ✅ No processes found on port %PORT%
echo 🟢 Port %PORT% is available
goto end

:list_ports
echo 📋 Checking processes on common backend ports...
echo.

set "COMMON_PORTS=9000 8000 5000 3000 8080 5432"
set "FOUND_ANY=0"

for %%p in (%COMMON_PORTS%) do (
    set "PORT_PROCESSES="
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING" 2^>nul') do (
        set "PID=%%a"
        if not "!PID!"=="" (
            for /f "tokens=1" %%b in ('tasklist /fi "PID eq !PID!" /fo csv /nh 2^>nul ^| findstr /v "INFO:"') do (
                set "PROCESS_NAME=%%b"
                set "PROCESS_NAME=!PROCESS_NAME:"=!"
                echo 🔴 Port %%p: PID !PID! ^(!PROCESS_NAME!^)
                set "FOUND_ANY=1"
            )
        )
    )
    
    if "!PORT_PROCESSES!"=="" (
        echo 🟢 Port %%p: Available
    )
)

if "%FOUND_ANY%"=="0" (
    echo.
    echo ✅ All checked ports are available!
)
goto end

:kill_all_ports
echo 🧹 Cleaning up all common backend ports...
echo.

set "COMMON_PORTS=9000 8000 5000 3000 8080 5432"
set "KILLED_ANY=0"

for %%p in (%COMMON_PORTS%) do (
    echo Checking port %%p...
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING" 2^>nul') do (
        set "PID=%%a"
        if not "!PID!"=="" (
            for /f "tokens=1" %%b in ('tasklist /fi "PID eq !PID!" /fo csv /nh 2^>nul ^| findstr /v "INFO:"') do (
                set "PROCESS_NAME=%%b"
                set "PROCESS_NAME=!PROCESS_NAME:"=!"
                
                if "%FORCE_MODE%"=="0" (
                    set /p "confirm=❓ Kill process !PID! ^(!PROCESS_NAME!^) on port %%p? (y/N): "
                    if /i "!confirm!"=="y" (
                        call :kill_process !PID! !PROCESS_NAME! %%p
                    )
                ) else (
                    call :kill_process !PID! !PROCESS_NAME! %%p
                )
            )
        )
    )
)

if "%KILLED_ANY%"=="1" (
    echo.
    echo 🎉 Port cleanup completed!
) else (
    echo.
    echo ✅ No processes found on common ports
)
goto end

:kill_process
set "KILL_PID=%1"
set "KILL_NAME=%2"
set "KILL_PORT=%3"

if "%FORCE_MODE%"=="1" (
    taskkill /F /PID %KILL_PID% >nul 2>&1
) else (
    taskkill /PID %KILL_PID% >nul 2>&1
)

if %errorlevel%==0 (
    echo ✅ Killed process %KILL_PID% ^(%KILL_NAME%^) on port %KILL_PORT%
    set "KILLED_ANY=1"
) else (
    echo ❌ Failed to kill process %KILL_PID% on port %KILL_PORT%
)
goto :eof

:show_help
echo Safe Wave Port Killer - Batch File Edition
echo.
echo Usage: kill_port.bat [port] [OPTIONS]
echo.
echo Parameters:
echo    port        Port number to kill processes on ^(default: 9000^)
echo.
echo Options:
echo    --force     Force kill processes without confirmation
echo    --all       Kill processes on all common backend ports
echo    --list      List processes on ports without killing them
echo    --help      Show this help message
echo.
echo Examples:
echo    kill_port.bat                  # Kill default backend port ^(9000^)
echo    kill_port.bat 8000             # Kill specific port
echo    kill_port.bat --all            # Kill all common backend ports
echo    kill_port.bat --list           # List processes on common ports
echo    kill_port.bat 9000 --force     # Force kill with no confirmation
echo.
echo Common use cases:
echo    - Backend port is stuck after a crash
echo    - Docker containers aren't releasing ports properly
echo    - Development server is stuck and won't restart
echo.
echo Windows-specific tips:
echo    - Run as Administrator for better permissions
echo    - Use Task Manager for detailed process information
echo    - Use 'netstat -ano' to manually check port usage
echo.
goto end

:end
echo.
pause