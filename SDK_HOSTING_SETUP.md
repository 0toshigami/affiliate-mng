# SDK Hosting Setup - Complete Guide

This document explains how the Affiliate Tracking SDK is hosted and served via the FastAPI backend.

## Overview

The JavaScript tracking SDK is built in the `sdk/` directory and served as static files from the FastAPI backend at the `/sdk/*` endpoint. This approach provides a simple, self-hosted solution without requiring a separate CDN or static file server.

## Architecture

```
┌─────────────┐
│   sdk/      │
│   ├── src/  │ → Build → ┌──────────────┐    Docker Volume    ┌─────────────────┐
│   └── dist/ │           │  sdk/dist/   │ ─────────────────→ │ backend/        │
└─────────────┘           │  (built JS)  │    (read-only)     │ sdk_files/      │
                          └──────────────┘                     └─────────────────┘
                                                                        │
                                                                        ↓
                                                               FastAPI StaticFiles
                                                                        │
                                                                        ↓
                                                             http://api/sdk/*.js
```

## Files Modified

### 1. `backend/app/main.py`

Added SDK static file mounting:

```python
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Mount SDK static files
sdk_path = Path(__file__).parent.parent / "sdk_files"
if sdk_path.exists():
    app.mount(
        "/sdk",
        StaticFiles(directory=str(sdk_path)),
        name="sdk"
    )
```

Also updated the root endpoint to show SDK availability:

```python
@app.get("/")
async def root():
    # ... returns SDK file URLs if available
```

### 2. `backend/Dockerfile`

Added SDK directory creation:

```dockerfile
# Create SDK files directory (will be populated via volume mount)
RUN mkdir -p ./sdk_files
```

### 3. `docker-compose.yml`

Added volume mount to backend service:

```yaml
backend:
  volumes:
    - ./backend:/app
    - ./sdk/dist:/app/sdk_files:ro  # Mount SDK files as read-only
```

### 4. Build Scripts

Created convenience scripts:
- `scripts/build-and-deploy-sdk.sh` (Linux/Mac)
- `scripts/build-and-deploy-sdk.bat` (Windows)

### 5. Documentation

Updated `CLAUDE.md` with SDK hosting information and deployment instructions.

## How to Use

### 1. Build the SDK

```bash
# Option 1: Build directly
cd sdk
npm install
npm run build

# Option 2: Use the script (Linux/Mac)
./scripts/build-and-deploy-sdk.sh

# Option 3: Use the script (Windows)
scripts\build-and-deploy-sdk.bat
```

### 2. Verify Build Output

```bash
ls -la sdk/dist/

# You should see:
# affiliate-sdk.js         - UMD build (unminified, ~20KB)
# affiliate-sdk.min.js     - UMD build (minified, ~5KB)
# affiliate-sdk.esm.js     - ES Module build
# index.d.ts              - TypeScript definitions
# *.js.map                - Source maps
```

### 3. Start/Restart Backend

```bash
# Start all services
docker-compose up -d

# Or restart just the backend
docker-compose restart backend
```

### 4. Test SDK Availability

```bash
# Check root endpoint for SDK info
curl http://localhost:8000/

# Download SDK file
curl http://localhost:8000/sdk/affiliate-sdk.min.js

# Or open in browser
open http://localhost:8000/sdk/affiliate-sdk.min.js
```

### 5. Test Integration

Open the test page in your browser:

```bash
# Serve the test file (Python)
python -m http.server 8080

# Then open: http://localhost:8080/test-sdk-integration.html
```

Or simply open `test-sdk-integration.html` directly in your browser.

## SDK Endpoints

Once deployed, the following SDK files are available:

| Endpoint | Description | Size | Use Case |
|----------|-------------|------|----------|
| `/sdk/affiliate-sdk.min.js` | Minified UMD build | ~5KB | **Production** - Include via `<script>` tag |
| `/sdk/affiliate-sdk.js` | Unminified UMD build | ~20KB | **Development** - Easier debugging |
| `/sdk/affiliate-sdk.esm.js` | ES Module build | ~15KB | **Modern bundlers** - Import as module |
| `/sdk/index.d.ts` | TypeScript definitions | ~2KB | **TypeScript projects** - Type safety |

## Integration Examples

### Basic HTML Integration

```html
<!-- Include SDK from your backend -->
<script src="https://your-api-domain.com/sdk/affiliate-sdk.min.js"></script>

<script>
  // Initialize SDK
  AffiliateSDK.init({
    apiUrl: 'https://your-api-domain.com/api/v1'
  });

  // Track a conversion
  AffiliateSDK.trackConversion({
    type: 'SALE',
    value: 99.99,
    currency: 'USD'
  });
</script>
```

### ES Module Import

```javascript
import AffiliateSDK from 'https://your-api-domain.com/sdk/affiliate-sdk.esm.js';

AffiliateSDK.init({
  apiUrl: 'https://your-api-domain.com/api/v1'
});
```

### NPM Package (if published)

```bash
npm install @affiliate-mng/tracking-sdk
```

```javascript
import AffiliateSDK from '@affiliate-mng/tracking-sdk';
```

## Development Workflow

### Making Changes to SDK

1. **Edit SDK source files** in `sdk/src/`
2. **Rebuild the SDK**: `cd sdk && npm run build`
3. **Restart backend**: `docker-compose restart backend`
4. **Test changes**: Open test page or use curl

### Watching for Changes (Development)

```bash
cd sdk
npm run dev  # Watches for changes and rebuilds automatically
```

In another terminal:
```bash
docker-compose restart backend  # Restart after each build
```

## Production Deployment

### Option 1: Self-Hosted (Current Setup)

**Pros:**
- Simple deployment
- No additional infrastructure
- Works immediately

**Cons:**
- Backend handles SDK requests
- Not optimized for high traffic

**Best for:** Small to medium traffic (~1000 req/day)

### Option 2: With CDN (Recommended for Scale)

Add a CDN in front of your API:

**CloudFlare:**
```
1. Add your API domain to CloudFlare
2. Create page rule for /sdk/*
3. Set cache level: "Cache Everything"
4. Edge Cache TTL: 1 month
```

**AWS CloudFront:**
```
1. Create distribution with your API as origin
2. Add behavior for /sdk/* path pattern
3. Set TTL to 2592000 seconds (30 days)
4. Enable compression
```

**Pros:**
- Reduced backend load
- Global edge caching
- Better performance

**Best for:** High traffic (>10,000 req/day)

### Option 3: Separate Static Host

Upload SDK files to:
- AWS S3 + CloudFront
- Vercel/Netlify static hosting
- Google Cloud Storage + CDN

**Pros:**
- Completely separate from backend
- Best performance
- Highest availability

**Cons:**
- Additional deployment step
- More complex setup

## Caching Strategy

### Current Setup (No Caching)

FastAPI StaticFiles serves files without special caching headers.

### Add Caching Headers (Optional)

Modify `backend/app/main.py`:

```python
from fastapi.responses import FileResponse
from datetime import datetime, timedelta

@app.get("/sdk/{filename}")
async def serve_sdk(filename: str):
    file_path = sdk_path / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # Set cache headers
    headers = {
        "Cache-Control": "public, max-age=2592000",  # 30 days
        "Expires": (datetime.now() + timedelta(days=30)).strftime("%a, %d %b %Y %H:%M:%S GMT")
    }

    return FileResponse(file_path, headers=headers)
```

## Monitoring

### Check SDK Availability

```bash
# Health check with SDK info
curl http://localhost:8000/

# Expected response:
{
  "message": "Affiliate Programs Management System API",
  "version": "0.1.0",
  "docs": "/api/v1/docs",
  "sdk": {
    "available": true,
    "files": {
      "minified": "/sdk/affiliate-sdk.min.js",
      "unminified": "/sdk/affiliate-sdk.js",
      "esm": "/sdk/affiliate-sdk.esm.js",
      "types": "/sdk/index.d.ts"
    }
  }
}
```

### Track SDK Usage (Optional)

Add logging to track SDK downloads:

```python
from app.core.logging import logger

@app.get("/sdk/{filename}")
async def serve_sdk(filename: str, request: Request):
    logger.info(f"SDK file requested: {filename} from {request.client.host}")
    # ... serve file
```

## Troubleshooting

### SDK Returns 404

**Check if SDK is built:**
```bash
ls sdk/dist/
```

If empty:
```bash
cd sdk
npm run build
```

**Check volume mount:**
```bash
docker-compose exec backend ls -la /app/sdk_files/
```

Should show SDK files. If empty, rebuild and restart:
```bash
cd sdk && npm run build
docker-compose restart backend
```

### SDK Files Are Old

After rebuilding, the volume mount should automatically reflect changes. If not:

```bash
# Restart backend to pick up changes
docker-compose restart backend

# Or rebuild container
docker-compose up -d --build backend
```

### CORS Errors

If SDK loads but tracking fails with CORS errors:

1. Check backend CORS settings in `backend/app/core/config.py`
2. Add your website domain to `CORS_ORIGINS` list
3. Restart backend

## Security Considerations

### Read-Only Volume

The Docker volume is mounted as read-only (`:ro`):
```yaml
- ./sdk/dist:/app/sdk_files:ro
```

This prevents the backend from modifying SDK files.

### No Sensitive Data

SDK files are public and contain no sensitive information:
- No API keys
- No database credentials
- No backend logic

### Rate Limiting (Optional)

For production, consider adding rate limiting to SDK endpoints:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/sdk/{filename}")
@limiter.limit("100/minute")
async def serve_sdk(filename: str):
    # ... serve file
```

## Next Steps

1. ✅ SDK hosting is now set up
2. ✅ Build and deploy scripts created
3. ✅ Documentation updated
4. 🔄 Test SDK integration with test page
5. 🔄 Deploy to production
6. 🔄 Monitor usage and performance
7. 🔄 Consider CDN for scale

## References

- SDK Source: `sdk/src/`
- Build Output: `sdk/dist/`
- Backend Mounting: `backend/app/main.py`
- Docker Config: `docker-compose.yml`
- Test Page: `test-sdk-integration.html`
- Documentation: `CLAUDE.md`, `sdk/README.md`
