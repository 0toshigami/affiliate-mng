"""
Commission Management Endpoints
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.database import get_db
from app.api.deps import get_current_active_user, get_admin_user
from app.core.exceptions import NotFoundError, BadRequestError, AuthorizationError
from app.models.user import User, UserRole
from app.models.conversion import Commission as CommissionModel, CommissionStatus
from app.models.affiliate import AffiliateProfile
from app.schemas.conversion import Commission, CommissionUpdate

router = APIRouter()


@router.get("/", response_model=List[Commission])
def list_commissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[CommissionStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List commissions
    - Admins see all commissions
    - Affiliates see only their own commissions
    """
    query = db.query(CommissionModel)

    if current_user.role != UserRole.ADMIN:
        # Get affiliate ID for current user
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate:
            return []

        query = query.filter(CommissionModel.affiliate_id == affiliate.id)

    if status:
        query = query.filter(CommissionModel.status == status)

    commissions = query.order_by(CommissionModel.created_at.desc()).offset(skip).limit(limit).all()
    return commissions


@router.get("/stats")
def get_commission_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get commission statistics
    - Admins see all stats
    - Affiliates see only their own stats
    """
    query = db.query(CommissionModel)

    if current_user.role != UserRole.ADMIN:
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate:
            return {
                "total_pending": Decimal("0.00"),
                "total_approved": Decimal("0.00"),
                "total_paid": Decimal("0.00"),
                "count_pending": 0,
                "count_approved": 0,
                "count_paid": 0,
            }

        query = query.filter(CommissionModel.affiliate_id == affiliate.id)

    # Calculate stats
    stats = {
        "total_pending": Decimal("0.00"),
        "total_approved": Decimal("0.00"),
        "total_paid": Decimal("0.00"),
        "count_pending": 0,
        "count_approved": 0,
        "count_paid": 0,
    }

    # Get totals by status
    pending = query.filter(CommissionModel.status == CommissionStatus.PENDING).all()
    approved = query.filter(CommissionModel.status == CommissionStatus.APPROVED).all()
    paid = query.filter(CommissionModel.status == CommissionStatus.PAID).all()

    stats["total_pending"] = sum(c.final_amount for c in pending)
    stats["total_approved"] = sum(c.final_amount for c in approved)
    stats["total_paid"] = sum(c.final_amount for c in paid)
    stats["count_pending"] = len(pending)
    stats["count_approved"] = len(approved)
    stats["count_paid"] = len(paid)

    return stats


@router.get("/{commission_id}", response_model=Commission)
def get_commission(
    commission_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get commission by ID
    """
    commission = db.query(CommissionModel).filter(
        CommissionModel.id == commission_id
    ).first()

    if not commission:
        raise NotFoundError("Commission not found")

    # Check authorization
    if current_user.role != UserRole.ADMIN:
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate or commission.affiliate_id != affiliate.id:
            raise AuthorizationError("You can only view your own commissions")

    return commission


@router.post("/{commission_id}/approve", response_model=Commission)
def approve_commission(
    commission_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Approve a pending commission (admin only)
    """
    commission = db.query(CommissionModel).filter(
        CommissionModel.id == commission_id
    ).first()

    if not commission:
        raise NotFoundError("Commission not found")

    if commission.status != CommissionStatus.PENDING:
        raise BadRequestError("Commission is not pending")

    commission.status = CommissionStatus.APPROVED
    db.commit()
    db.refresh(commission)

    return commission


@router.post("/{commission_id}/reject", response_model=Commission)
def reject_commission(
    commission_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Reject a commission (admin only)
    """
    commission = db.query(CommissionModel).filter(
        CommissionModel.id == commission_id
    ).first()

    if not commission:
        raise NotFoundError("Commission not found")

    if commission.status != CommissionStatus.PENDING:
        raise BadRequestError("Commission is not pending")

    commission.status = CommissionStatus.REJECTED
    db.commit()
    db.refresh(commission)

    return commission
