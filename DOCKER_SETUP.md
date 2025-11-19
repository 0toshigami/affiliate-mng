# Docker Setup Guide

This document provides comprehensive guidance for running the Affiliate Programs Management System using Docker.

## Quick Start (Development)

```bash
# 1. Ensure SDK is built
cd sdk
npm run build
cd ..

# 2. Start all services
docker-compose up -d

# 3. Check service health
docker-compose ps

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. (Optional) Seed database with test data
docker-compose exec backend python seed_db.py

# 6. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
# SDK: http://localhost:8000/sdk/affiliate-sdk.min.js
```

## Architecture Overview

The Docker setup includes four services:

1. **PostgreSQL** (postgres:15-alpine) - Database
2. **Redis** (redis:7-alpine) - Caching and sessions
3. **Backend** (FastAPI) - API server
4. **Frontend** (Next.js 16) - Web application

All services are connected via a custom bridge network (`affiliate-network`) for inter-service communication.

## Environment Configuration

### Backend Environment Variables

The backend uses `backend/.env` file with the following key variables:

```env
# Security
SECRET_KEY=<generated-secure-key>

# Database (uses Docker service name)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/affiliate_mng

# Redis (uses Docker service name)
REDIS_URL=redis://redis:6379/0

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

**Important:** The DATABASE_URL and REDIS_URL use Docker service names (`postgres`, `redis`) instead of `localhost` for proper container-to-container communication.

### Frontend Environment Variables

The frontend uses `frontend/.env.local` file:

```env
# Client-side API URL (for browser requests)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Additionally, docker-compose.yml sets:
```env
# Server-side API URL (for SSR requests within Docker network)
API_URL=http://backend:8000
```

### Why Two API URLs?

The frontend needs different API URLs depending on the context:

- **Client-side (browser):** Uses `NEXT_PUBLIC_API_URL=http://localhost:8000` because the browser runs on the user's machine
- **Server-side (SSR):** Uses `API_URL=http://backend:8000` because Next.js server runs inside the Docker container

The API client (`frontend/lib/api.ts`) automatically selects the correct URL based on whether it's running on the server (`typeof window === "undefined"`) or in the browser.

## Service Details

### PostgreSQL

**Configuration:**
- Image: `postgres:15-alpine`
- Port: `5432:5432` (exposed for debugging)
- Volume: `postgres_data` (persistent storage)
- Health check: `pg_isready -U postgres`

**Access from host:**
```bash
psql -h localhost -U postgres -d affiliate_mng
```

**Access from backend container:**
Uses `postgres:5432` via Docker network.

### Redis

**Configuration:**
- Image: `redis:7-alpine`
- Port: `6379:6379` (exposed for debugging)
- Volume: `redis_data` (AOF persistence)
- Health check: `redis-cli ping`

**Access from host:**
```bash
redis-cli -h localhost
```

**Access from backend container:**
Uses `redis:6379` via Docker network.

### Backend

**Configuration:**
- Build: `./backend/Dockerfile`
- Port: `8000:8000`
- Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` (dev mode)
- Volumes:
  - `./backend:/app` - Source code (hot-reload)
  - `./sdk/dist:/app/sdk_files:ro` - SDK files (read-only)

**Dependencies:**
- Waits for PostgreSQL to be healthy
- Waits for Redis to be healthy

**Environment:**
Loaded from `backend/.env` via `env_file` directive.

### Frontend

**Configuration:**
- Build: `./frontend/Dockerfile`
- Port: `3000:3000`
- Command: `npm run dev` (development mode)
- Volumes:
  - `./frontend:/app` - Source code (hot-reload)
  - `/app/node_modules` - Anonymous volume (prevents host override)
  - `/app/.next` - Anonymous volume (build cache)

**Environment:**
- Loaded from `frontend/.env.local` via `env_file` directive
- `API_URL` set directly in docker-compose.yml (overrides .env.local)

## SDK Hosting

The backend serves the JavaScript tracking SDK as static files:

**Build the SDK:**
```bash
cd sdk
npm run build
```

**Files served:**
- `/sdk/affiliate-sdk.min.js` - Production (minified)
- `/sdk/affiliate-sdk.js` - Debug (with comments)
- `/sdk/affiliate-sdk.esm.js` - ES Module
- `/sdk/index.d.ts` - TypeScript definitions

**Access:**
- http://localhost:8000/sdk/affiliate-sdk.min.js
- http://localhost:8000/sdk/affiliate-sdk.js
- http://localhost:8000/sdk/affiliate-sdk.esm.js

**How it works:**
1. SDK is built in `sdk/dist/` directory
2. Docker mounts `./sdk/dist:/app/sdk_files:ro` (read-only)
3. Backend's `main.py` serves files from `/app/sdk_files` at `/sdk` endpoint

**Updating SDK:**
```bash
cd sdk
npm run build
cd ..
docker-compose restart backend  # Pick up new files
```

## Common Operations

### Starting Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Start and view logs
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Seed database
docker-compose exec backend python seed_db.py

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d affiliate_mng

# Backup database
docker-compose exec postgres pg_dump -U postgres affiliate_mng > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres affiliate_mng
```

### Executing Commands

```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# Run Python script
docker-compose exec backend python -c "print('Hello')"

# Install new Python package
docker-compose exec backend pip install package-name

# Install new npm package
docker-compose exec frontend npm install package-name
```

### Rebuilding Containers

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and start
docker-compose up -d --build
```

## Production Deployment

For production deployment, use the production override file:

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Production Features (docker-compose.prod.yml)

1. **Security:**
   - PostgreSQL and Redis ports not exposed to host
   - Source code not mounted (uses built images)

2. **Performance:**
   - Backend runs with multiple workers (`--workers 4`)
   - Frontend runs production build (`npm run start`)
   - Resource limits and reservations configured

3. **Reliability:**
   - Health checks for all services
   - Proper dependency ordering with health conditions
   - Structured logging with rotation

4. **Resource Limits:**
   - PostgreSQL: 2GB RAM, 2 CPUs max
   - Redis: 512MB RAM, 1 CPU max
   - Backend: 2GB RAM, 2 CPUs max
   - Frontend: 1GB RAM, 1 CPU max

### Production Checklist

Before deploying to production:

- [ ] Update `SECRET_KEY` in `backend/.env` with a secure random key
- [ ] Update `FIRST_SUPERUSER_PASSWORD` with a strong password
- [ ] Update `CORS_ORIGINS` with your production frontend URL
- [ ] Update `NEXT_PUBLIC_API_URL` with your production backend URL
- [ ] Configure SMTP settings for email notifications
- [ ] Set up SSL/TLS termination (nginx, Traefik, etc.)
- [ ] Configure backup strategy for PostgreSQL and Redis
- [ ] Set up monitoring and alerting
- [ ] Review and adjust resource limits based on your infrastructure
- [ ] Consider using Docker secrets for sensitive data

## Troubleshooting

### Service won't start

```bash
# Check logs for errors
docker-compose logs <service-name>

# Check service status
docker-compose ps

# Rebuild and restart
docker-compose up -d --build <service-name>
```

### Database connection errors

```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify DATABASE_URL in backend/.env uses "postgres" not "localhost"
docker-compose exec backend env | grep DATABASE_URL
```

### Frontend can't reach backend

**Client-side (browser) errors:**
- Check `NEXT_PUBLIC_API_URL` is set to `http://localhost:8000`
- Verify CORS_ORIGINS in backend includes `http://localhost:3000`
- Check backend is accessible: `curl http://localhost:8000/health`

**Server-side (SSR) errors:**
- Check `API_URL` is set to `http://backend:8000` in docker-compose.yml
- Verify backend service is healthy: `docker-compose ps backend`
- Check frontend logs: `docker-compose logs frontend`

### SDK not loading

```bash
# Verify SDK files exist
ls -la sdk/dist/

# If missing, build SDK
cd sdk && npm run build && cd ..

# Restart backend to pick up files
docker-compose restart backend

# Test SDK endpoint
curl http://localhost:8000/sdk/affiliate-sdk.min.js

# Check backend logs
docker-compose logs backend | grep -i sdk
```

### Permission errors

On Linux/Mac, you may encounter permission issues:

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo docker-compose up -d
```

### Port already in use

```bash
# Find process using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or change port in docker-compose.yml
```

### Out of disk space

```bash
# Remove unused containers, images, networks
docker system prune

# Remove unused volumes (WARNING: deletes data)
docker volume prune

# Check disk usage
docker system df
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.yml` to add PostgreSQL configuration:

```yaml
postgres:
  command: postgres -c max_connections=200 -c shared_buffers=256MB -c effective_cache_size=1GB
```

### Redis

Edit `docker-compose.yml` to add Redis configuration:

```yaml
redis:
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Backend

Adjust number of workers in production:

```yaml
backend:
  command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 8
```

Rule of thumb: `workers = (2 × CPU cores) + 1`

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health (in production with health check enabled)
curl http://localhost:3000/

# Database health
docker-compose exec postgres pg_isready -U postgres

# Redis health
docker-compose exec redis redis-cli ping
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific service
docker stats affiliate-mng-backend

# Logs with timestamps
docker-compose logs -f --timestamps
```

## Security Best Practices

1. **Secrets Management:**
   - Use Docker secrets in production
   - Never commit `.env` files with real credentials
   - Rotate `SECRET_KEY` regularly

2. **Network Security:**
   - Don't expose PostgreSQL/Redis ports in production
   - Use SSL/TLS for all external connections
   - Implement rate limiting on backend

3. **Image Security:**
   - Use official Alpine images (smaller attack surface)
   - Regularly update base images
   - Scan images for vulnerabilities: `docker scan <image>`

4. **Container Security:**
   - Run containers as non-root user (already configured in Dockerfiles)
   - Use read-only mounts where possible (SDK mount is read-only)
   - Limit container capabilities

5. **Data Security:**
   - Encrypt data at rest (PostgreSQL, Redis)
   - Regular backups with encryption
   - Secure backup storage

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
