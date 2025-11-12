"""
Affiliate Schemas
"""
from datetime import datetime
from typing import Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl

from app.models.affiliate import ApprovalStatus, PaymentMethod


class AffiliateProfileBase(BaseModel):
    """Base affiliate profile schema"""
    company_name: Optional[str] = Field(None, max_length=255)
    website_url: Optional[HttpUrl] = None
    social_media: Optional[Dict[str, str]] = Field(default_factory=dict)


class AffiliateProfileCreate(AffiliateProfileBase):
    """Schema for creating an affiliate profile"""
    pass


class AffiliateProfileUpdate(AffiliateProfileBase):
    """Schema for updating an affiliate profile"""
    payment_method: Optional[PaymentMethod] = None
    payment_details: Optional[Dict] = None
    tax_info: Optional[Dict] = None


class AffiliateProfile(AffiliateProfileBase):
    """Schema for affiliate profile response"""
    id: UUID
    user_id: UUID
    affiliate_code: str
    tier_id: Optional[UUID] = None
    payment_method: Optional[PaymentMethod] = None
    approval_status: ApprovalStatus
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AffiliateApprovalRequest(BaseModel):
    """Schema for approving/rejecting an affiliate"""
    tier_id: Optional[UUID] = None
    rejection_reason: Optional[str] = None
