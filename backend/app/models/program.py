"""
Program Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ProgramType(str, enum.Enum):
    """Program type enumeration"""
    SAAS = "saas"
    LEAD_GEN = "lead_gen"
    CONTENT_MEDIA = "content_media"


class ProgramStatus(str, enum.Enum):
    """Program status enumeration"""
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class EnrollmentStatus(str, enum.Enum):
    """Enrollment status enumeration"""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    TERMINATED = "terminated"


class AffiliateProgram(Base):
    """Affiliate program model"""
    __tablename__ = "affiliate_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    program_type = Column(SQLEnum(ProgramType), nullable=False)
    status = Column(SQLEnum(ProgramStatus), default=ProgramStatus.ACTIVE, nullable=False)

    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    terms_and_conditions = Column(Text, nullable=True)
    commission_config = Column(JSONB, default=dict, nullable=False)  # Flexible commission rules

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    enrollments = relationship("ProgramEnrollment", back_populates="program", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AffiliateProgram {self.name}>"


class ProgramEnrollment(Base):
    """Program enrollment model - links affiliates to programs"""
    __tablename__ = "program_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    affiliate_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_profiles.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_programs.id", ondelete="CASCADE"), nullable=False)

    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.PENDING, nullable=False)
    custom_commission_config = Column(JSONB, default=dict)  # Override program defaults

    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    terminated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    affiliate = relationship("AffiliateProfile", back_populates="enrollments")
    program = relationship("AffiliateProgram", back_populates="enrollments")

    def __repr__(self):
        return f"<ProgramEnrollment affiliate={self.affiliate_id} program={self.program_id}>"
