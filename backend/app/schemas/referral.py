"""
Referral Link Schemas
"""
from datetime import datetime
from typing import Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl

from app.models.referral import ReferralLinkStatus


class ReferralLinkBase(BaseModel):
    """Base referral link schema"""
    target_url: str = Field(..., max_length=1000)
    utm_params: Optional[Dict[str, str]] = Field(default_factory=dict)
    link_metadata: Optional[Dict] = Field(default_factory=dict)
    expires_at: Optional[datetime] = None


class ReferralLinkCreate(ReferralLinkBase):
    """Schema for creating a referral link"""
    program_id: UUID


class ReferralLinkUpdate(BaseModel):
    """Schema for updating a referral link"""
    target_url: Optional[str] = Field(None, max_length=1000)
    utm_params: Optional[Dict[str, str]] = None
    link_metadata: Optional[Dict] = None
    status: Optional[ReferralLinkStatus] = None
    expires_at: Optional[datetime] = None


class ReferralLink(ReferralLinkBase):
    """Schema for referral link response"""
    id: UUID
    enrollment_id: UUID
    affiliate_id: UUID
    program_id: UUID
    link_code: str
    clicks_count: int
    conversions_count: int
    status: ReferralLinkStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReferralLinkWithUrl(ReferralLink):
    """Schema for referral link with full URL"""
    full_url: str


class ReferralClickCreate(BaseModel):
    """Schema for creating a referral click (internal use)"""
    referral_link_id: UUID
    visitor_session_id: UUID
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer_url: Optional[str] = None
    geo_location: Optional[Dict] = Field(default_factory=dict)


class ReferralClick(BaseModel):
    """Schema for referral click response"""
    id: UUID
    referral_link_id: UUID
    visitor_session_id: UUID
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer_url: Optional[str] = None
    geo_location: Optional[Dict] = None
    clicked_at: datetime

    class Config:
        from_attributes = True


class ReferralLinkStats(BaseModel):
    """Schema for referral link statistics"""
    link_code: str
    total_clicks: int
    unique_visitors: int
    conversions: int
    conversion_rate: float
    last_click_at: Optional[datetime] = None
