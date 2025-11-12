"""
Affiliate Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Numeric, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ApprovalStatus(str, enum.Enum):
    """Approval status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaymentMethod(str, enum.Enum):
    """Payment method enumeration"""
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"
    STRIPE = "stripe"


class AffiliateTier(Base):
    """Affiliate tier model"""
    __tablename__ = "affiliate_tiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False)  # e.g., Bronze, Silver, Gold
    level = Column(Integer, nullable=False, unique=True)  # For ordering
    commission_multiplier = Column(Numeric(5, 2), default=1.0, nullable=False)  # e.g., 1.0, 1.2, 1.5
    requirements = Column(JSONB, default=dict)  # Min referrals, revenue, etc.
    benefits = Column(JSONB, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    affiliates = relationship("AffiliateProfile", back_populates="tier")

    def __repr__(self):
        return f"<AffiliateTier {self.name} (Level {self.level})>"


class AffiliateProfile(Base):
    """Affiliate profile model"""
    __tablename__ = "affiliate_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    affiliate_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., AFF-XXXXX
    tier_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_tiers.id"), nullable=True)

    # Business info
    company_name = Column(String(255), nullable=True)
    website_url = Column(String(500), nullable=True)
    social_media = Column(JSONB, default=dict)  # {"twitter": "...", "linkedin": "...", etc.}

    # Payment info (should be encrypted in production)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    payment_details = Column(JSONB, default=dict)  # Encrypted payment details
    tax_info = Column(JSONB, default=dict)  # Encrypted tax information

    # Approval
    approval_status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="affiliate_profile", foreign_keys=[user_id])
    tier = relationship("AffiliateTier", back_populates="affiliates")
    approver = relationship("User", foreign_keys=[approved_by])
    enrollments = relationship("ProgramEnrollment", back_populates="affiliate", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AffiliateProfile {self.affiliate_code}>"
