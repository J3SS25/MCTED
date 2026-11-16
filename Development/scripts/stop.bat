@echo off
REM ==============================================================================
REM MCTEB Stop Script (Windows)
REM Sends SIGINT to any node processes bound on port 3000 or 5173
REM ==============================================================================

echo Stopping MCTEB servers on ports 3000 and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing PID %%a (port 3000)
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    echo Killing PID %%a (port 5173)
    taskkill /F /PID %%a 2>nul
)

echo Done.
