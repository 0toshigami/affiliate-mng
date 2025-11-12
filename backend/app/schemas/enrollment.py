"""
Program Enrollment Schemas
"""
from datetime import datetime
from typing import Optional, Dict
from uuid import UUID
from pydantic import BaseModel

from app.models.program import EnrollmentStatus


class ProgramEnrollmentBase(BaseModel):
    """Base program enrollment schema"""
    custom_commission_config: Optional[Dict] = None


class ProgramEnrollmentCreate(BaseModel):
    """Schema for creating a program enrollment"""
    program_id: UUID
    custom_commission_config: Optional[Dict] = None


class ProgramEnrollmentUpdate(BaseModel):
    """Schema for updating a program enrollment"""
    status: Optional[EnrollmentStatus] = None
    custom_commission_config: Optional[Dict] = None


class ProgramEnrollment(ProgramEnrollmentBase):
    """Schema for program enrollment response"""
    id: UUID
    affiliate_id: UUID
    program_id: UUID
    status: EnrollmentStatus
    enrolled_at: datetime
    terminated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgramEnrollmentWithDetails(ProgramEnrollment):
    """Schema for program enrollment with program details"""
    program_name: str
    program_slug: str
    program_type: str
