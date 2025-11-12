"""
Conversion and Commission Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ConversionType(str, enum.Enum):
    """Conversion type enumeration"""
    SALE = "sale"
    LEAD = "lead"
    SIGNUP = "signup"
    CUSTOM = "custom"


class ConversionStatus(str, enum.Enum):
    """Conversion status enumeration"""
    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"
    REVERSED = "reversed"


class Conversion(Base):
    """Conversion model - tracks successful referrals"""
    __tablename__ = "conversions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    referral_link_id = Column(UUID(as_uuid=True), ForeignKey("referral_links.id", ondelete="CASCADE"), nullable=False, index=True)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Optional customer reference

    conversion_type = Column(SQLEnum(ConversionType), nullable=False)
    visitor_session_id = Column(UUID(as_uuid=True), index=True, nullable=False)  # Link to original click

    # Financial details
    conversion_value = Column(Numeric(10, 2), default=0.0, nullable=False)  # Order amount, lead value, etc.
    currency = Column(String(3), default="USD", nullable=False)

    # Status and validation
    status = Column(SQLEnum(ConversionStatus), default=ConversionStatus.PENDING, nullable=False, index=True)
    conversion_metadata = Column(JSONB, default=dict)  # Order details, lead info, custom data

    # Timestamps
    converted_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    referral_link = relationship("ReferralLink")
    affiliate = relationship("AffiliateProfile")
    program = relationship("AffiliateProgram")
    customer = relationship("User", foreign_keys=[customer_id])
    commission = relationship("Commission", back_populates="conversion", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversion {self.id} - {self.conversion_type}>"


class CommissionStatus(str, enum.Enum):
    """Commission status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class Commission(Base):
    """Commission model - calculated earnings for conversions"""
    __tablename__ = "commissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversion_id = Column(UUID(as_uuid=True), ForeignKey("conversions.id", ondelete="CASCADE"), unique=True, nullable=False)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    tier_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_tiers.id"), nullable=True)

    # Commission calculation details
    commission_rule = Column(JSONB, default=dict)  # Snapshot of rule used for calculation
    base_amount = Column(Numeric(10, 2), nullable=False)  # Base commission before multiplier
    tier_multiplier = Column(Numeric(5, 2), default=1.0, nullable=False)  # Tier bonus
    final_amount = Column(Numeric(10, 2), nullable=False)  # Final amount to pay
    currency = Column(String(3), default="USD", nullable=False)

    # Approval and payment
    status = Column(SQLEnum(CommissionStatus), default=CommissionStatus.PENDING, nullable=False, index=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Payout tracking
    payout_id = Column(UUID(as_uuid=True), ForeignKey("payouts.id"), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    conversion = relationship("Conversion", back_populates="commission")
    affiliate = relationship("AffiliateProfile")
    program = relationship("AffiliateProgram")
    tier = relationship("AffiliateTier")
    approver = relationship("User", foreign_keys=[approved_by])
    payout = relationship("Payout", back_populates="commissions")

    def __repr__(self):
        return f"<Commission {self.id} - ${self.final_amount}>"


class PayoutStatus(str, enum.Enum):
    """Payout status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Payout(Base):
    """Payout model - batch payments to affiliates"""
    __tablename__ = "payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    # Payout period
    payout_period_start = Column(DateTime, nullable=False)
    payout_period_end = Column(DateTime, nullable=False)

    # Financial details
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    commission_count = Column(Numeric, default=0, nullable=False)  # Number of commissions included

    # Payment details
    payment_method = Column(String(50), nullable=True)  # bank_transfer, paypal, stripe
    payment_reference = Column(String(255), nullable=True)  # Transaction ID, check number, etc.

    # Status and approval
    status = Column(SQLEnum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False, index=True)
    processed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)

    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    affiliate = relationship("AffiliateProfile")
    processor = relationship("User", foreign_keys=[processed_by])
    commissions = relationship("Commission", back_populates="payout")

    def __repr__(self):
        return f"<Payout {self.id} - ${self.total_amount}>"
