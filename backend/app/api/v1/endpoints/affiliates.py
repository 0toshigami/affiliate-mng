"""
Affiliate Management Endpoints
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_active_user, get_admin_user, get_affiliate_user
from app.core.exceptions import NotFoundError, ConflictError, BadRequestError, AuthorizationError
from app.models.user import User, UserRole
from app.models.affiliate import AffiliateProfile, ApprovalStatus
from app.schemas.affiliate import (
    AffiliateProfile as AffiliateProfileSchema,
    AffiliateProfileCreate,
    AffiliateProfileUpdate,
    AffiliateApprovalRequest,
)
from app.services.affiliate_service import (
    create_affiliate_profile,
    approve_affiliate,
    reject_affiliate,
)

router = APIRouter()


@router.post("/apply", response_model=AffiliateProfileSchema)
def apply_as_affiliate(
    profile_data: AffiliateProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Apply to become an affiliate
    """
    # Check if user already has an affiliate profile
    existing = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if existing:
        raise ConflictError("User already has an affiliate profile")

    # Create affiliate profile
    profile = create_affiliate_profile(
        db=db,
        user=current_user,
        company_name=profile_data.company_name,
        website_url=str(profile_data.website_url) if profile_data.website_url else None,
        social_media=profile_data.social_media,
    )

    # Update user role to affiliate if currently customer
    if current_user.role == UserRole.CUSTOMER:
        current_user.role = UserRole.AFFILIATE
        db.commit()

    return profile


@router.get("/", response_model=List[AffiliateProfileSchema])
def list_affiliates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[ApprovalStatus] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List all affiliates (admin only)
    """
    query = db.query(AffiliateProfile)

    if status:
        query = query.filter(AffiliateProfile.approval_status == status)

    affiliates = query.offset(skip).limit(limit).all()
    return affiliates


@router.get("/me", response_model=AffiliateProfileSchema)
def get_my_affiliate_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get current user's affiliate profile
    """
    profile = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise NotFoundError("Affiliate profile not found")

    return profile


@router.get("/{affiliate_id}", response_model=AffiliateProfileSchema)
def get_affiliate(
    affiliate_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get affiliate by ID
    Affiliates can only view their own profile, admins can view any
    """
    profile = db.query(AffiliateProfile).filter(
        AffiliateProfile.id == affiliate_id
    ).first()

    if not profile:
        raise NotFoundError("Affiliate profile not found")

    # Check authorization
    if current_user.role != UserRole.ADMIN and profile.user_id != current_user.id:
        raise AuthorizationError("You can only view your own affiliate profile")

    return profile


@router.patch("/me", response_model=AffiliateProfileSchema)
def update_my_affiliate_profile(
    profile_update: AffiliateProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's affiliate profile
    """
    profile = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise NotFoundError("Affiliate profile not found")

    # Update fields
    update_data = profile_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "website_url" and value:
            value = str(value)
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


@router.post("/{affiliate_id}/approve", response_model=AffiliateProfileSchema)
def approve_affiliate_application(
    affiliate_id: UUID,
    approval_data: AffiliateApprovalRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Approve an affiliate application (admin only)
    """
    profile = db.query(AffiliateProfile).filter(
        AffiliateProfile.id == affiliate_id
    ).first()

    if not profile:
        raise NotFoundError("Affiliate profile not found")

    if profile.approval_status != ApprovalStatus.PENDING:
        raise BadRequestError("Affiliate application is not pending")

    profile = approve_affiliate(
        db=db,
        affiliate=profile,
        admin_user=current_user,
        tier_id=str(approval_data.tier_id) if approval_data.tier_id else None,
    )

    return profile


@router.post("/{affiliate_id}/reject", response_model=AffiliateProfileSchema)
def reject_affiliate_application(
    affiliate_id: UUID,
    approval_data: AffiliateApprovalRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Reject an affiliate application (admin only)
    """
    profile = db.query(AffiliateProfile).filter(
        AffiliateProfile.id == affiliate_id
    ).first()

    if not profile:
        raise NotFoundError("Affiliate profile not found")

    if profile.approval_status != ApprovalStatus.PENDING:
        raise BadRequestError("Affiliate application is not pending")

    if not approval_data.rejection_reason:
        raise BadRequestError("Rejection reason is required")

    profile = reject_affiliate(
        db=db,
        affiliate=profile,
        admin_user=current_user,
        reason=approval_data.rejection_reason,
    )

    return profile
