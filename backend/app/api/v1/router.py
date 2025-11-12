"""
API v1 Router
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, affiliates, programs, referrals

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(affiliates.router, prefix="/affiliates", tags=["Affiliates"])
api_router.include_router(programs.router, prefix="/programs", tags=["Programs"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["Referrals"])
