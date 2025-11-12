"""
Program Schemas
"""
from datetime import datetime, date
from typing import Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.program import ProgramType, ProgramStatus


class AffiliateProgramBase(BaseModel):
    """Base affiliate program schema"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    program_type: ProgramType
    terms_and_conditions: Optional[str] = None
    commission_config: Dict = Field(default_factory=dict)


class AffiliateProgramCreate(AffiliateProgramBase):
    """Schema for creating an affiliate program"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AffiliateProgramUpdate(BaseModel):
    """Schema for updating an affiliate program"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    program_type: Optional[ProgramType] = None
    status: Optional[ProgramStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    terms_and_conditions: Optional[str] = None
    commission_config: Optional[Dict] = None


class AffiliateProgram(AffiliateProgramBase):
    """Schema for affiliate program response"""
    id: UUID
    status: ProgramStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
