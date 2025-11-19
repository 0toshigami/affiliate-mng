# Scripts Directory

This directory contains utility scripts for building and deploying the Affiliate Management System components.

## SDK Build and Deploy Scripts

### `build-and-deploy-sdk.sh` (Linux/Mac)

Builds the JavaScript tracking SDK and prepares it for serving via the FastAPI backend.

**Usage:**
```bash
./scripts/build-and-deploy-sdk.sh
```

**What it does:**
1. Navigates to `sdk/` directory
2. Installs npm dependencies if needed
3. Builds SDK files using Rollup
4. Verifies build output
5. Provides next steps for deployment

**Requirements:**
- Node.js 20+ installed
- npm installed

---

### `build-and-deploy-sdk.bat` (Windows)

Windows version of the SDK build script.

**Usage:**
```batch
scripts\build-and-deploy-sdk.bat
```

Same functionality as the Linux/Mac version.

---

## SDK Deployment Flow

1. **Build the SDK**:
   ```bash
   ./scripts/build-and-deploy-sdk.sh
   ```

2. **Verify build output**:
   ```bash
   ls -la sdk/dist/
   # Should see: affiliate-sdk.min.js, affiliate-sdk.js, affiliate-sdk.esm.js, index.d.ts
   ```

3. **Restart backend** (Docker):
   ```bash
   docker-compose restart backend
   ```

4. **Test SDK availability**:
   ```bash
   curl http://localhost:8000/sdk/affiliate-sdk.min.js
   # Should return JavaScript code

   # Check SDK info at root endpoint
   curl http://localhost:8000/
   # Should show "sdk": { "available": true, ... }
   ```

5. **Use in production**:
   - SDK is automatically served from `/sdk` endpoint
   - URL: `https://your-api-domain.com/sdk/affiliate-sdk.min.js`
   - Include in merchant websites via `<script>` tag

---

## How SDK Hosting Works

The backend FastAPI application serves SDK files as static assets:

- **Source**: `sdk/dist/` directory (built files)
- **Mounted to**: `backend/sdk_files/` directory (via Docker volume)
- **Served at**: `/sdk/*` endpoint
- **Configuration**: `backend/app/main.py` mounts StaticFiles

**Docker volume mount** (in `docker-compose.yml`):
```yaml
volumes:
  - ./sdk/dist:/app/sdk_files:ro
```

The `:ro` flag makes the mount read-only for security.

---

## Troubleshooting

### SDK not found (404 error)

**Check if SDK is built**:
```bash
ls sdk/dist/
```

If empty, run:
```bash
cd sdk
npm run build
```

**Check backend logs**:
```bash
docker-compose logs backend | grep -i sdk
```

**Verify volume mount**:
```bash
docker-compose exec backend ls -la /app/sdk_files/
```

Should show the SDK files.

### SDK files outdated

After rebuilding the SDK, restart the backend:
```bash
docker-compose restart backend
```

The volume mount is read-only, so changes in `sdk/dist/` are immediately available after backend restart.

---

## Production Deployment

For production deployments:

1. **Build SDK** locally or in CI/CD pipeline
2. **Ensure `sdk/dist/` is included** in deployment package
3. **Backend will automatically serve** files from `/sdk` endpoint
4. **Configure CDN** (optional) to cache SDK files for better performance

### Using a CDN (Optional)

For high-traffic scenarios, you can put a CDN in front of your API:

- CloudFlare: Set up caching rules for `/sdk/*` paths
- AWS CloudFront: Create distribution with backend as origin
- Nginx reverse proxy: Add caching headers for `/sdk/*`

This reduces load on your backend for SDK requests.
