"""
Program Management Endpoints
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from python_slugify import slugify

from app.database import get_db
from app.api.deps import get_current_active_user, get_admin_user, get_affiliate_user
from app.core.exceptions import NotFoundError, ConflictError, BadRequestError, AuthorizationError
from app.models.user import User, UserRole
from app.models.affiliate import AffiliateProfile, ApprovalStatus
from app.models.program import AffiliateProgram, ProgramEnrollment, ProgramStatus, EnrollmentStatus
from app.schemas.program import (
    AffiliateProgram as AffiliateProgramSchema,
    AffiliateProgramCreate,
    AffiliateProgramUpdate,
)
from app.schemas.enrollment import (
    ProgramEnrollment as ProgramEnrollmentSchema,
    ProgramEnrollmentCreate,
    ProgramEnrollmentUpdate,
)

router = APIRouter()


# ===== Program Management =====

@router.post("/", response_model=AffiliateProgramSchema)
def create_program(
    program_data: AffiliateProgramCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Create a new affiliate program (admin only)
    """
    # Check if slug already exists
    existing = db.query(AffiliateProgram).filter(
        AffiliateProgram.slug == program_data.slug
    ).first()

    if existing:
        raise ConflictError(f"Program with slug '{program_data.slug}' already exists")

    program = AffiliateProgram(
        **program_data.model_dump(),
        created_by=current_user.id,
    )

    db.add(program)
    db.commit()
    db.refresh(program)

    return program


@router.get("/", response_model=List[AffiliateProgramSchema])
def list_programs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[ProgramStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List all programs
    Affiliates see only active programs, admins see all
    """
    query = db.query(AffiliateProgram)

    # Non-admin users only see active programs
    if current_user.role != UserRole.ADMIN:
        query = query.filter(AffiliateProgram.status == ProgramStatus.ACTIVE)
    elif status:
        query = query.filter(AffiliateProgram.status == status)

    programs = query.offset(skip).limit(limit).all()
    return programs


@router.get("/{program_id}", response_model=AffiliateProgramSchema)
def get_program(
    program_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get program by ID
    """
    program = db.query(AffiliateProgram).filter(
        AffiliateProgram.id == program_id
    ).first()

    if not program:
        raise NotFoundError("Program not found")

    # Non-admin users can only view active programs
    if current_user.role != UserRole.ADMIN and program.status != ProgramStatus.ACTIVE:
        raise NotFoundError("Program not found")

    return program


@router.patch("/{program_id}", response_model=AffiliateProgramSchema)
def update_program(
    program_id: UUID,
    program_update: AffiliateProgramUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Update a program (admin only)
    """
    program = db.query(AffiliateProgram).filter(
        AffiliateProgram.id == program_id
    ).first()

    if not program:
        raise NotFoundError("Program not found")

    # Check slug uniqueness if changing
    if program_update.slug and program_update.slug != program.slug:
        existing = db.query(AffiliateProgram).filter(
            AffiliateProgram.slug == program_update.slug
        ).first()
        if existing:
            raise ConflictError(f"Program with slug '{program_update.slug}' already exists")

    # Update fields
    update_data = program_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)

    return program


@router.delete("/{program_id}")
def delete_program(
    program_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Delete (archive) a program (admin only)
    """
    program = db.query(AffiliateProgram).filter(
        AffiliateProgram.id == program_id
    ).first()

    if not program:
        raise NotFoundError("Program not found")

    # Soft delete by archiving
    program.status = ProgramStatus.ARCHIVED
    db.commit()

    return {"message": "Program archived successfully"}


# ===== Program Enrollment =====

@router.post("/{program_id}/enroll", response_model=ProgramEnrollmentSchema)
def enroll_in_program(
    program_id: UUID,
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    Enroll in a program (affiliate only)
    """
    # Check if program exists and is active
    program = db.query(AffiliateProgram).filter(
        AffiliateProgram.id == program_id,
        AffiliateProgram.status == ProgramStatus.ACTIVE,
    ).first()

    if not program:
        raise NotFoundError("Program not found or not active")

    # Get affiliate profile
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate:
        raise BadRequestError("You must have an affiliate profile to enroll")

    if affiliate.approval_status != ApprovalStatus.APPROVED:
        raise BadRequestError("Your affiliate application must be approved first")

    # Check if already enrolled
    existing = db.query(ProgramEnrollment).filter(
        ProgramEnrollment.affiliate_id == affiliate.id,
        ProgramEnrollment.program_id == program_id,
    ).first()

    if existing:
        if existing.status == EnrollmentStatus.TERMINATED:
            # Reactivate enrollment
            existing.status = EnrollmentStatus.ACTIVE
            existing.terminated_at = None
            db.commit()
            db.refresh(existing)
            return existing
        else:
            raise ConflictError("You are already enrolled in this program")

    # Create enrollment
    enrollment = ProgramEnrollment(
        affiliate_id=affiliate.id,
        program_id=program_id,
        status=EnrollmentStatus.ACTIVE,
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment


@router.get("/{program_id}/enrollments", response_model=List[ProgramEnrollmentSchema])
def list_program_enrollments(
    program_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List all enrollments for a program (admin only)
    """
    enrollments = db.query(ProgramEnrollment).filter(
        ProgramEnrollment.program_id == program_id
    ).offset(skip).limit(limit).all()

    return enrollments


@router.get("/enrollments/me", response_model=List[ProgramEnrollmentSchema])
def get_my_enrollments(
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    Get current affiliate's enrollments
    """
    # Get affiliate profile
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate:
        return []

    enrollments = db.query(ProgramEnrollment).filter(
        ProgramEnrollment.affiliate_id == affiliate.id
    ).all()

    return enrollments


@router.patch("/enrollments/{enrollment_id}", response_model=ProgramEnrollmentSchema)
def update_enrollment(
    enrollment_id: UUID,
    enrollment_update: ProgramEnrollmentUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Update an enrollment (admin only)
    """
    enrollment = db.query(ProgramEnrollment).filter(
        ProgramEnrollment.id == enrollment_id
    ).first()

    if not enrollment:
        raise NotFoundError("Enrollment not found")

    # Update fields
    update_data = enrollment_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(enrollment, field, value)

    # Set terminated_at if status is changed to terminated
    if enrollment_update.status == EnrollmentStatus.TERMINATED and not enrollment.terminated_at:
        from datetime import datetime
        enrollment.terminated_at = datetime.utcnow()

    db.commit()
    db.refresh(enrollment)

    return enrollment
