@echo off
REM Sudoku Game - Database Setup and Testing Script
REM Run this in PowerShell or Command Prompt to set up and test the database

echo.
echo ====================================================
echo Sudoku Game - Database Setup Verification
echo ====================================================
echo.

REM Check if PHP exists
where php >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PHP not found in PATH
    echo Please ensure PHP is installed and in your system PATH
    pause
    exit /b 1
)

echo [OK] PHP found: 
php -v | findstr "PHP"
echo.

REM Check if SQLite extension is available
echo Checking SQLite extension...
php -r "echo extension_loaded('pdo_sqlite') ? '[OK] SQLite available' . PHP_EOL : '[ERROR] SQLite not available' . PHP_EOL;"
echo.

REM Navigate to backend directory
cd /d "%~dp0app\backend"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not navigate to backend directory
    pause
    exit /b 1
)

echo [OK] Backend directory found
echo [OK] Current directory: %CD%
echo.

REM Check if public directory exists
if not exist "public" (
    echo [ERROR] public directory not found
    pause
    exit /b 1
)

echo [OK] Public directory found
echo.

REM Start PHP server
echo Starting PHP development server on http://localhost:8000...
echo.
echo Press Ctrl+C to stop the server
echo.

php -S localhost:8000 -t public
