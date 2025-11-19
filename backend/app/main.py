"""
FastAPI Application Entry Point
"""
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Affiliate Programs Management System API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount SDK static files
# SDK files should be in /app/sdk_files directory (copied during Docker build)
sdk_path = Path(__file__).parent.parent / "sdk_files"
if sdk_path.exists():
    app.mount(
        "/sdk",
        StaticFiles(directory=str(sdk_path)),
        name="sdk"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.VERSION,
            "service": settings.PROJECT_NAME,
        }
    )


@app.get("/")
async def root():
    """Root endpoint"""
    sdk_available = sdk_path.exists()
    response = {
        "message": "Affiliate Programs Management System API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
    }

    if sdk_available:
        response["sdk"] = {
            "available": True,
            "files": {
                "minified": "/sdk/affiliate-sdk.min.js",
                "unminified": "/sdk/affiliate-sdk.js",
                "esm": "/sdk/affiliate-sdk.esm.js",
                "types": "/sdk/index.d.ts"
            },
            "integration": "Include <script src=\"{your-api-url}/sdk/affiliate-sdk.min.js\"></script> in your HTML"
        }

    return response
