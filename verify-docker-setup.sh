#!/bin/bash

# Docker Setup Verification Script
# This script verifies that the Docker Compose setup is configured correctly

echo "========================================="
echo "Docker Setup Verification"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is installed
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_status 0 "Docker is installed: $DOCKER_VERSION"
else
    print_status 1 "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
echo ""
echo "2. Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_status 0 "Docker Compose is installed: $COMPOSE_VERSION"
else
    print_status 1 "Docker Compose is not installed"
    exit 1
fi

# Check if docker-compose.yml exists
echo ""
echo "3. Checking configuration files..."
if [ -f "docker-compose.yml" ]; then
    print_status 0 "docker-compose.yml exists"
else
    print_status 1 "docker-compose.yml not found"
    exit 1
fi

if [ -f "docker-compose.prod.yml" ]; then
    print_status 0 "docker-compose.prod.yml exists"
else
    print_warning "docker-compose.prod.yml not found (optional)"
fi

# Validate docker-compose.yml
echo ""
echo "4. Validating docker-compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    print_status 0 "docker-compose.yml is valid"
else
    print_status 1 "docker-compose.yml has errors"
    docker-compose config
    exit 1
fi

# Check environment files
echo ""
echo "5. Checking environment files..."
if [ -f "backend/.env" ]; then
    print_status 0 "backend/.env exists"

    # Check for critical variables
    if grep -q "DATABASE_URL=postgresql://.*@postgres:" backend/.env; then
        print_status 0 "DATABASE_URL uses Docker service name 'postgres'"
    else
        print_warning "DATABASE_URL might not use Docker service name"
    fi

    if grep -q "REDIS_URL=redis://redis:" backend/.env; then
        print_status 0 "REDIS_URL uses Docker service name 'redis'"
    else
        print_warning "REDIS_URL might not use Docker service name"
    fi

    if grep -q "SECRET_KEY=your-secret-key-here-change-in-production" backend/.env; then
        print_warning "SECRET_KEY is still using default value - change it!"
    elif grep -q "SECRET_KEY=dev-secret-key" backend/.env; then
        print_warning "SECRET_KEY appears to be a dev key - change for production!"
    else
        print_status 0 "SECRET_KEY appears to be customized"
    fi
else
    print_warning "backend/.env not found - will use docker-compose environment variables"
fi

if [ -f "frontend/.env.local" ]; then
    print_status 0 "frontend/.env.local exists"

    if grep -q "NEXT_PUBLIC_API_URL" frontend/.env.local; then
        print_status 0 "NEXT_PUBLIC_API_URL is defined"
    else
        print_warning "NEXT_PUBLIC_API_URL not found in .env.local"
    fi
else
    print_warning "frontend/.env.local not found - will use docker-compose environment variables"
fi

# Check SDK files
echo ""
echo "6. Checking SDK files..."
if [ -d "sdk/dist" ]; then
    print_status 0 "sdk/dist directory exists"

    if [ -f "sdk/dist/affiliate-sdk.min.js" ]; then
        SIZE=$(du -h sdk/dist/affiliate-sdk.min.js | cut -f1)
        print_status 0 "affiliate-sdk.min.js exists ($SIZE)"
    else
        print_status 1 "affiliate-sdk.min.js not found - run 'cd sdk && npm run build'"
    fi

    if [ -f "sdk/dist/affiliate-sdk.js" ]; then
        print_status 0 "affiliate-sdk.js exists (debug version)"
    else
        print_warning "affiliate-sdk.js not found"
    fi

    if [ -f "sdk/dist/affiliate-sdk.esm.js" ]; then
        print_status 0 "affiliate-sdk.esm.js exists (ESM version)"
    else
        print_warning "affiliate-sdk.esm.js not found"
    fi
else
    print_status 1 "sdk/dist directory not found - run 'cd sdk && npm run build'"
fi

# Check if services are running
echo ""
echo "7. Checking running services..."
if docker-compose ps > /dev/null 2>&1; then
    RUNNING_SERVICES=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
    if [ "$RUNNING_SERVICES" -gt 0 ]; then
        print_status 0 "$RUNNING_SERVICES service(s) are running"
        docker-compose ps
    else
        print_warning "No services are running - start with 'docker-compose up -d'"
    fi
else
    print_warning "Unable to check running services"
fi

# Summary
echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo ""
echo "Next steps:"
echo ""

if [ ! -d "sdk/dist" ] || [ ! -f "sdk/dist/affiliate-sdk.min.js" ]; then
    echo "1. Build the SDK:"
    echo "   cd sdk && npm run build && cd .."
    echo ""
fi

if [ "$RUNNING_SERVICES" -eq 0 ] || [ -z "$RUNNING_SERVICES" ]; then
    echo "2. Start the services:"
    echo "   docker-compose up -d"
    echo ""
    echo "3. Run database migrations:"
    echo "   docker-compose exec backend alembic upgrade head"
    echo ""
    echo "4. (Optional) Seed the database:"
    echo "   docker-compose exec backend python seed_db.py"
    echo ""
fi

echo "Access the application:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/api/v1/docs"
echo "  SDK:       http://localhost:8000/sdk/affiliate-sdk.min.js"
echo ""
echo "For more information, see DOCKER_SETUP.md"
echo ""
