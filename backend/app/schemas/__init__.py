"""
Pydantic Schemas for Request/Response Validation
"""
from app.schemas.user import User, UserCreate, UserUpdate, UserInDB
from app.schemas.auth import Token, TokenPayload, LoginRequest, RegisterRequest
from app.schemas.affiliate import AffiliateProfile, AffiliateProfileCreate, AffiliateProfileUpdate
from app.schemas.program import AffiliateProgram, AffiliateProgramCreate, AffiliateProgramUpdate
from app.schemas.enrollment import ProgramEnrollment, ProgramEnrollmentCreate, ProgramEnrollmentUpdate
from app.schemas.referral import ReferralLink, ReferralLinkCreate, ReferralLinkUpdate, ReferralLinkWithUrl
from app.schemas.conversion import (
    Conversion,
    ConversionCreate,
    ConversionUpdate,
    Commission,
    CommissionUpdate,
    Payout,
    PayoutCreate,
    PayoutUpdate,
)

__all__ = [
    "User",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
    "Token",
    "TokenPayload",
    "LoginRequest",
    "RegisterRequest",
    "AffiliateProfile",
    "AffiliateProfileCreate",
    "AffiliateProfileUpdate",
    "AffiliateProgram",
    "AffiliateProgramCreate",
    "AffiliateProgramUpdate",
    "ProgramEnrollment",
    "ProgramEnrollmentCreate",
    "ProgramEnrollmentUpdate",
    "ReferralLink",
    "ReferralLinkCreate",
    "ReferralLinkUpdate",
    "ReferralLinkWithUrl",
    "Conversion",
    "ConversionCreate",
    "ConversionUpdate",
    "Commission",
    "CommissionUpdate",
    "Payout",
    "PayoutCreate",
    "PayoutUpdate",
]
