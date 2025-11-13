"""
Payout Management Endpoints
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db
from app.api.deps import get_current_active_user, get_admin_user
from app.core.exceptions import NotFoundError, BadRequestError, AuthorizationError
from app.models.user import User, UserRole
from app.models.conversion import Payout as PayoutModel, PayoutStatus, Commission, CommissionStatus
from app.models.affiliate import AffiliateProfile
from app.schemas.conversion import Payout, PayoutCreate, PayoutUpdate
from app.services.payout_service import (
    generate_payout as generate_payout_service,
    process_payout as process_payout_service,
)

router = APIRouter()


@router.post("/", response_model=Payout)
def generate_payout(
    payout_data: PayoutCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Generate a payout for an affiliate (admin only)
    Collects all approved, unpaid commissions within the date range
    """
    # Get affiliate
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.id == payout_data.affiliate_id
    ).first()

    if not affiliate:
        raise NotFoundError("Affiliate not found")

    # Generate payout
    payout = generate_payout_service(
        db=db,
        affiliate=affiliate,
        start_date=payout_data.start_date,
        end_date=payout_data.end_date,
    )

    if not payout:
        raise BadRequestError("No approved commissions found for the specified period")

    return payout


@router.get("/", response_model=List[Payout])
def list_payouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[PayoutStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List payouts
    - Admins see all payouts
    - Affiliates see only their own payouts
    """
    query = db.query(PayoutModel)

    if current_user.role != UserRole.ADMIN:
        # Get affiliate ID for current user
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate:
            return []

        query = query.filter(PayoutModel.affiliate_id == affiliate.id)

    if status:
        query = query.filter(PayoutModel.status == status)

    payouts = query.order_by(PayoutModel.created_at.desc()).offset(skip).limit(limit).all()
    return payouts


@router.get("/stats")
def get_payout_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get payout statistics
    - Admins see all stats
    - Affiliates see only their own stats
    """
    query = db.query(PayoutModel)

    if current_user.role != UserRole.ADMIN:
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate:
            return {
                "total_pending": Decimal("0.00"),
                "total_processing": Decimal("0.00"),
                "total_paid": Decimal("0.00"),
                "count_pending": 0,
                "count_processing": 0,
                "count_paid": 0,
            }

        query = query.filter(PayoutModel.affiliate_id == affiliate.id)

    # Calculate stats
    stats = {
        "total_pending": Decimal("0.00"),
        "total_processing": Decimal("0.00"),
        "total_paid": Decimal("0.00"),
        "count_pending": 0,
        "count_processing": 0,
        "count_paid": 0,
    }

    # Get totals by status
    pending = query.filter(PayoutModel.status == PayoutStatus.PENDING).all()
    processing = query.filter(PayoutModel.status == PayoutStatus.PROCESSING).all()
    paid = query.filter(PayoutModel.status == PayoutStatus.COMPLETED).all()

    stats["total_pending"] = sum(p.total_amount for p in pending)
    stats["total_processing"] = sum(p.total_amount for p in processing)
    stats["total_paid"] = sum(p.total_amount for p in paid)
    stats["count_pending"] = len(pending)
    stats["count_processing"] = len(processing)
    stats["count_paid"] = len(paid)

    return stats


@router.get("/{payout_id}", response_model=Payout)
def get_payout(
    payout_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get payout by ID with associated commissions
    """
    payout = db.query(PayoutModel).filter(
        PayoutModel.id == payout_id
    ).first()

    if not payout:
        raise NotFoundError("Payout not found")

    # Check authorization
    if current_user.role != UserRole.ADMIN:
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first()

        if not affiliate or payout.affiliate_id != affiliate.id:
            raise AuthorizationError("You can only view your own payouts")

    return payout


@router.post("/{payout_id}/process", response_model=Payout)
def process_payout(
    payout_id: UUID,
    payment_reference: str = Query(..., min_length=1),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Mark a payout as paid (admin only)
    Updates all associated commissions to 'paid' status
    """
    payout = db.query(PayoutModel).filter(
        PayoutModel.id == payout_id
    ).first()

    if not payout:
        raise NotFoundError("Payout not found")

    if payout.status == PayoutStatus.PAID:
        raise BadRequestError("Payout is already paid")

    if payout.status == PayoutStatus.CANCELLED:
        raise BadRequestError("Payout is cancelled")

    # Process payout
    payout = process_payout_service(
        db=db,
        payout=payout,
        payment_reference=payment_reference,
    )

    return payout


@router.post("/{payout_id}/cancel", response_model=Payout)
def cancel_payout(
    payout_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Cancel a pending payout (admin only)
    Returns associated commissions to 'approved' status
    """
    payout = db.query(PayoutModel).filter(
        PayoutModel.id == payout_id
    ).first()

    if not payout:
        raise NotFoundError("Payout not found")

    if payout.status == PayoutStatus.PAID:
        raise BadRequestError("Cannot cancel a paid payout")

    if payout.status == PayoutStatus.CANCELLED:
        raise BadRequestError("Payout is already cancelled")

    # Update payout status
    payout.status = PayoutStatus.CANCELLED

    # Return commissions to approved status
    commissions = db.query(Commission).filter(
        Commission.payout_id == payout.id
    ).all()

    for commission in commissions:
        commission.status = CommissionStatus.APPROVED
        commission.payout_id = None

    db.commit()
    db.refresh(payout)

    return payout
