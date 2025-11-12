"""
Conversion Management Endpoints
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_active_user, get_admin_user, get_affiliate_user
from app.core.exceptions import NotFoundError, BadRequestError, AuthorizationError
from app.models.user import User, UserRole
from app.models.conversion import Conversion as ConversionModel, ConversionType, ConversionStatus
from app.models.referral import ReferralLink
from app.schemas.conversion import (
    Conversion,
    ConversionCreate,
    ConversionUpdate,
)
from app.services.conversion_service import (
    create_conversion as create_conversion_service,
    validate_conversion as validate_conversion_service,
    reject_conversion as reject_conversion_service,
)

router = APIRouter()


@router.post("/", response_model=Conversion)
def create_conversion(
    conversion_data: ConversionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new conversion (admin or API)
    In production, this would typically be called via webhook or API integration
    """
    # Find referral link by code
    link = db.query(ReferralLink).filter(
        ReferralLink.link_code == conversion_data.referral_link_code
    ).first()

    if not link:
        raise NotFoundError("Referral link not found")

    # Create conversion
    conversion = create_conversion_service(
        db=db,
        referral_link=link,
        conversion_type=conversion_data.conversion_type,
        visitor_session_id=str(conversion_data.visitor_session_id),
        conversion_value=conversion_data.conversion_value,
        customer_id=str(conversion_data.customer_id) if conversion_data.customer_id else None,
        metadata=conversion_data.metadata,
        auto_validate=(current_user.role == UserRole.ADMIN),  # Auto-validate for admin
    )

    return conversion


@router.get("/", response_model=List[Conversion])
def list_conversions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[ConversionStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List conversions
    - Admins see all conversions
    - Affiliates see only their own conversions
    """
    query = db.query(ConversionModel)

    if current_user.role != UserRole.ADMIN:
        # Get affiliate ID for current user
        from app.models.affiliate import AffiliateProfile
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate:
            return []

        query = query.filter(ConversionModel.affiliate_id == affiliate.id)

    if status:
        query = query.filter(ConversionModel.status == status)

    conversions = query.order_by(ConversionModel.created_at.desc()).offset(skip).limit(limit).all()
    return conversions


@router.get("/{conversion_id}", response_model=Conversion)
def get_conversion(
    conversion_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get conversion by ID
    """
    conversion = db.query(ConversionModel).filter(
        ConversionModel.id == conversion_id
    ).first()

    if not conversion:
        raise NotFoundError("Conversion not found")

    # Check authorization
    if current_user.role != UserRole.ADMIN:
        from app.models.affiliate import AffiliateProfile
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate or conversion.affiliate_id != affiliate.id:
            raise AuthorizationError("You can only view your own conversions")

    return conversion


@router.post("/{conversion_id}/validate", response_model=Conversion)
def validate_conversion(
    conversion_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Validate a pending conversion and create commission (admin only)
    """
    conversion = db.query(ConversionModel).filter(
        ConversionModel.id == conversion_id
    ).first()

    if not conversion:
        raise NotFoundError("Conversion not found")

    if conversion.status != ConversionStatus.PENDING:
        raise BadRequestError("Conversion is not pending")

    conversion = validate_conversion_service(db, conversion)
    return conversion


@router.post("/{conversion_id}/reject", response_model=Conversion)
def reject_conversion(
    conversion_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Reject a conversion (admin only)
    """
    conversion = db.query(ConversionModel).filter(
        ConversionModel.id == conversion_id
    ).first()

    if not conversion:
        raise NotFoundError("Conversion not found")

    if conversion.status != ConversionStatus.PENDING:
        raise BadRequestError("Conversion is not pending")

    conversion = reject_conversion_service(db, conversion)
    return conversion
