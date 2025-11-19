@echo off
REM Build and Deploy SDK Script (Windows)
REM This script builds the JavaScript SDK and makes it available to the backend for serving

echo Building Affiliate Tracking SDK...
echo.

REM Navigate to SDK directory
cd /d "%~dp0\..\sdk"

REM Install dependencies if needed
if not exist "node_modules\" (
    echo Installing SDK dependencies...
    call npm install
)

REM Build the SDK
echo Building SDK files...
call npm run build

REM Check if build was successful
if not exist "dist\affiliate-sdk.min.js" (
    echo Build failed! SDK files not found in dist/
    exit /b 1
)

echo.
echo SDK built successfully!
echo.
echo Built files:
dir /B dist\*.js dist\*.d.ts

echo.
echo SDK is ready to be served!
echo.
echo Next steps:
echo 1. Start/restart the backend: docker-compose restart backend
echo 2. SDK will be available at: http://localhost:8000/sdk/affiliate-sdk.min.js
echo 3. Check SDK info at: http://localhost:8000/
echo.
echo For production deployment:
echo - Ensure sdk/dist/ is included in your deployment
echo - Backend will automatically serve files from /sdk endpoint

pause
