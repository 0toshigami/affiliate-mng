"""
Referral and Tracking Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ReferralLinkStatus(str, enum.Enum):
    """Referral link status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"


class ReferralLink(Base):
    """Referral link model"""
    __tablename__ = "referral_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("program_enrollments.id", ondelete="CASCADE"), nullable=False)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_programs.id", ondelete="CASCADE"), nullable=False, index=True)

    link_code = Column(String(50), unique=True, index=True, nullable=False)  # Unique tracking code
    target_url = Column(String(1000), nullable=False)  # Where to redirect
    utm_params = Column(JSONB, default=dict)  # UTM parameters for tracking
    metadata = Column(JSONB, default=dict)  # Custom tracking data

    # Statistics (cached for performance)
    clicks_count = Column(Integer, default=0, nullable=False)
    conversions_count = Column(Integer, default=0, nullable=False)

    status = Column(SQLEnum(ReferralLinkStatus), default=ReferralLinkStatus.ACTIVE, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    enrollment = relationship("ProgramEnrollment")
    affiliate = relationship("AffiliateProfile")
    program = relationship("AffiliateProgram")
    clicks = relationship("ReferralClick", back_populates="referral_link", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ReferralLink {self.link_code}>"


class ReferralClick(Base):
    """Referral click tracking model"""
    __tablename__ = "referral_clicks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    referral_link_id = Column(UUID(as_uuid=True), ForeignKey("referral_links.id", ondelete="CASCADE"), nullable=False, index=True)

    visitor_session_id = Column(UUID(as_uuid=True), default=uuid.uuid4, index=True, nullable=False)
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    referrer_url = Column(String(1000), nullable=True)
    geo_location = Column(JSONB, default=dict)  # country, city, etc.

    clicked_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    referral_link = relationship("ReferralLink", back_populates="clicks")

    def __repr__(self):
        return f"<ReferralClick {self.id}>"
