@echo off
REM Docker Setup Verification Script for Windows
REM This script verifies that the Docker Compose setup is configured correctly

echo =========================================
echo Docker Setup Verification
echo =========================================
echo.

REM Check if Docker is installed
echo 1. Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker is installed
    docker --version
) else (
    echo [FAIL] Docker is not installed
    exit /b 1
)

REM Check if Docker Compose is installed
echo.
echo 2. Checking Docker Compose installation...
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker Compose is installed
    docker-compose --version
) else (
    echo [FAIL] Docker Compose is not installed
    exit /b 1
)

REM Check if docker-compose.yml exists
echo.
echo 3. Checking configuration files...
if exist docker-compose.yml (
    echo [OK] docker-compose.yml exists
) else (
    echo [FAIL] docker-compose.yml not found
    exit /b 1
)

if exist docker-compose.prod.yml (
    echo [OK] docker-compose.prod.yml exists
) else (
    echo [WARN] docker-compose.prod.yml not found ^(optional^)
)

REM Validate docker-compose.yml
echo.
echo 4. Validating docker-compose configuration...
docker-compose config >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] docker-compose.yml is valid
) else (
    echo [FAIL] docker-compose.yml has errors
    docker-compose config
    exit /b 1
)

REM Check environment files
echo.
echo 5. Checking environment files...
if exist backend\.env (
    echo [OK] backend\.env exists

    findstr /C:"DATABASE_URL=postgresql://.*@postgres:" backend\.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] DATABASE_URL uses Docker service name 'postgres'
    ) else (
        echo [WARN] DATABASE_URL might not use Docker service name
    )

    findstr /C:"REDIS_URL=redis://redis:" backend\.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] REDIS_URL uses Docker service name 'redis'
    ) else (
        echo [WARN] REDIS_URL might not use Docker service name
    )

    findstr /C:"SECRET_KEY=your-secret-key-here-change-in-production" backend\.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo [WARN] SECRET_KEY is still using default value - change it!
    ) else (
        findstr /C:"SECRET_KEY=dev-secret-key" backend\.env >nul 2>&1
        if %errorlevel% equ 0 (
            echo [WARN] SECRET_KEY appears to be a dev key - change for production!
        ) else (
            echo [OK] SECRET_KEY appears to be customized
        )
    )
) else (
    echo [WARN] backend\.env not found - will use docker-compose environment variables
)

if exist frontend\.env.local (
    echo [OK] frontend\.env.local exists

    findstr /C:"NEXT_PUBLIC_API_URL" frontend\.env.local >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] NEXT_PUBLIC_API_URL is defined
    ) else (
        echo [WARN] NEXT_PUBLIC_API_URL not found in .env.local
    )
) else (
    echo [WARN] frontend\.env.local not found - will use docker-compose environment variables
)

REM Check SDK files
echo.
echo 6. Checking SDK files...
if exist sdk\dist (
    echo [OK] sdk\dist directory exists

    if exist sdk\dist\affiliate-sdk.min.js (
        echo [OK] affiliate-sdk.min.js exists
    ) else (
        echo [FAIL] affiliate-sdk.min.js not found - run 'cd sdk && npm run build'
    )

    if exist sdk\dist\affiliate-sdk.js (
        echo [OK] affiliate-sdk.js exists ^(debug version^)
    ) else (
        echo [WARN] affiliate-sdk.js not found
    )

    if exist sdk\dist\affiliate-sdk.esm.js (
        echo [OK] affiliate-sdk.esm.js exists ^(ESM version^)
    ) else (
        echo [WARN] affiliate-sdk.esm.js not found
    )
) else (
    echo [FAIL] sdk\dist directory not found - run 'cd sdk && npm run build'
)

REM Check if services are running
echo.
echo 7. Checking running services...
docker-compose ps >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker Compose project exists
    docker-compose ps
) else (
    echo [WARN] No Docker Compose project found
)

REM Summary
echo.
echo =========================================
echo Verification Summary
echo =========================================
echo.
echo Next steps:
echo.

if not exist sdk\dist\affiliate-sdk.min.js (
    echo 1. Build the SDK:
    echo    cd sdk ^&^& npm run build ^&^& cd ..
    echo.
)

echo 2. Start the services:
echo    docker-compose up -d
echo.
echo 3. Run database migrations:
echo    docker-compose exec backend alembic upgrade head
echo.
echo 4. ^(Optional^) Seed the database:
echo    docker-compose exec backend python seed_db.py
echo.
echo Access the application:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/api/v1/docs
echo   SDK:       http://localhost:8000/sdk/affiliate-sdk.min.js
echo.
echo For more information, see DOCKER_SETUP.md
echo.
