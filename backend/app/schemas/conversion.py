"""
Conversion and Commission Schemas
"""
from datetime import datetime
from typing import Optional, Dict
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.conversion import (
    ConversionType,
    ConversionStatus,
    CommissionStatus,
    PayoutStatus,
)


# ===== Conversion Schemas =====

class ConversionBase(BaseModel):
    """Base conversion schema"""
    conversion_type: ConversionType
    conversion_value: Decimal = Field(default=Decimal("0"), ge=0)
    conversion_metadata: Optional[Dict] = Field(default_factory=dict)


class ConversionCreate(ConversionBase):
    """Schema for creating a conversion"""
    referral_link_code: str  # Use link code instead of ID
    visitor_session_id: UUID
    customer_id: Optional[UUID] = None


class SDKConversionCreate(BaseModel):
    """Schema for SDK conversion tracking (public endpoint)"""
    referral_link_code: str
    visitor_session_id: UUID
    conversion_type: ConversionType
    conversion_value: Optional[Decimal] = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    customer_id: Optional[UUID] = None
    conversion_metadata: Optional[Dict] = Field(default_factory=dict)


class ConversionUpdate(BaseModel):
    """Schema for updating a conversion"""
    status: Optional[ConversionStatus] = None
    conversion_value: Optional[Decimal] = None
    conversion_metadata: Optional[Dict] = None


class Conversion(ConversionBase):
    """Schema for conversion response"""
    id: UUID
    referral_link_id: UUID
    affiliate_id: UUID
    program_id: UUID
    customer_id: Optional[UUID] = None
    visitor_session_id: UUID
    currency: str
    status: ConversionStatus
    converted_at: datetime
    validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Commission Schemas =====

class CommissionBase(BaseModel):
    """Base commission schema"""
    pass


class CommissionUpdate(BaseModel):
    """Schema for updating a commission"""
    status: Optional[CommissionStatus] = None
    approved_by: Optional[UUID] = None


class Commission(BaseModel):
    """Schema for commission response"""
    id: UUID
    conversion_id: UUID
    affiliate_id: UUID
    program_id: UUID
    tier_id: Optional[UUID] = None
    commission_rule: Dict
    base_amount: Decimal
    tier_multiplier: Decimal
    final_amount: Decimal
    currency: str
    status: CommissionStatus
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    payout_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommissionWithDetails(Commission):
    """Commission with additional details"""
    conversion_value: Decimal
    conversion_type: ConversionType
    program_name: str


class CommissionSummary(BaseModel):
    """Summary of commission statistics"""
    total_commissions: int
    pending_count: int
    approved_count: int
    paid_count: int
    rejected_count: int
    total_pending_amount: Decimal
    total_approved_amount: Decimal
    total_paid_amount: Decimal
    currency: str = "USD"


# ===== Payout Schemas =====

class PayoutBase(BaseModel):
    """Base payout schema"""
    pass


class PayoutCreate(BaseModel):
    """Schema for creating a payout"""
    affiliate_id: UUID
    start_date: datetime
    end_date: datetime


class PayoutUpdate(BaseModel):
    """Schema for updating a payout"""
    status: Optional[PayoutStatus] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class PayoutProcess(BaseModel):
    """Schema for processing a payout"""
    payment_method: str
    payment_reference: str
    notes: Optional[str] = None


class Payout(BaseModel):
    """Schema for payout response"""
    id: UUID
    affiliate_id: UUID
    payout_period_start: datetime
    payout_period_end: datetime
    total_amount: Decimal
    currency: str
    commission_count: int
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    status: PayoutStatus
    processed_by: Optional[UUID] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayoutWithDetails(Payout):
    """Payout with affiliate details"""
    affiliate_code: str
    affiliate_company: Optional[str] = None


class PayoutSummary(BaseModel):
    """Summary of payout statistics"""
    total_payouts: int
    pending_count: int
    processing_count: int
    completed_count: int
    failed_count: int
    total_pending_amount: Decimal
    total_completed_amount: Decimal
    currency: str = "USD"
