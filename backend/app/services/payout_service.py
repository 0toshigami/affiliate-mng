"""
Payout Service - Business logic for payout management
"""
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.conversion import Commission, CommissionStatus, Payout, PayoutStatus
from app.models.affiliate import AffiliateProfile


def generate_payout(
    db: Session,
    affiliate: AffiliateProfile,
    start_date: datetime,
    end_date: datetime,
) -> Payout:
    """
    Generate a payout for an affiliate for a specific period
    Includes all approved commissions within the period
    """
    # Get approved commissions within the period that haven't been paid
    commissions = db.query(Commission).filter(
        Commission.affiliate_id == affiliate.id,
        Commission.status == CommissionStatus.APPROVED,
        Commission.payout_id.is_(None),  # Not already in a payout
        Commission.created_at >= start_date,
        Commission.created_at <= end_date,
    ).all()

    if not commissions:
        raise ValueError("No approved commissions found for this period")

    # Calculate total amount
    total_amount = sum(c.final_amount for c in commissions)

    # Create payout record
    payout = Payout(
        affiliate_id=affiliate.id,
        payout_period_start=start_date,
        payout_period_end=end_date,
        total_amount=total_amount,
        currency=commissions[0].currency if commissions else "USD",
        commission_count=len(commissions),
        status=PayoutStatus.PENDING,
    )

    db.add(payout)
    db.flush()  # Get payout ID

    # Link commissions to payout
    for commission in commissions:
        commission.payout_id = payout.id

    db.commit()
    db.refresh(payout)

    return payout


def generate_monthly_payouts(
    db: Session,
    year: int,
    month: int,
) -> List[Payout]:
    """
    Generate payouts for all affiliates for a specific month
    """
    # Calculate period start and end
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

    # Get all affiliates with approved commissions in this period
    affiliates_with_commissions = db.query(AffiliateProfile.id).join(
        Commission
    ).filter(
        Commission.status == CommissionStatus.APPROVED,
        Commission.payout_id.is_(None),
        Commission.created_at >= start_date,
        Commission.created_at <= end_date,
    ).distinct().all()

    payouts = []
    for (affiliate_id,) in affiliates_with_commissions:
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.id == affiliate_id
        ).first()

        if affiliate:
            try:
                payout = generate_payout(db, affiliate, start_date, end_date)
                payouts.append(payout)
            except ValueError:
                # No commissions for this affiliate
                continue

    return payouts


def process_payout(
    db: Session,
    payout: Payout,
    admin_user_id: str,
    payment_method: str,
    payment_reference: str,
    notes: Optional[str] = None,
) -> Payout:
    """
    Process a payout (mark as processing/completed)
    """
    payout.status = PayoutStatus.PROCESSING
    payout.payment_method = payment_method
    payout.payment_reference = payment_reference
    payout.processed_by = admin_user_id
    payout.processed_at = datetime.utcnow()
    if notes:
        payout.notes = notes

    db.commit()
    db.refresh(payout)

    return payout


def complete_payout(
    db: Session,
    payout: Payout,
) -> Payout:
    """
    Mark a payout as completed
    Updates all associated commissions to PAID status
    """
    payout.status = PayoutStatus.COMPLETED

    # Mark all commissions as paid
    for commission in payout.commissions:
        commission.status = CommissionStatus.PAID

    db.commit()
    db.refresh(payout)

    return payout


def fail_payout(
    db: Session,
    payout: Payout,
    notes: Optional[str] = None,
) -> Payout:
    """
    Mark a payout as failed
    Removes payout link from commissions so they can be included in next payout
    """
    payout.status = PayoutStatus.FAILED
    if notes:
        payout.notes = notes

    # Unlink commissions from failed payout
    for commission in payout.commissions:
        commission.payout_id = None

    db.commit()
    db.refresh(payout)

    return payout
