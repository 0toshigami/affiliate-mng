"""
Commission Service - Business logic for commission calculations
"""
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.conversion import Conversion, Commission, CommissionStatus
from app.models.affiliate import AffiliateProfile, AffiliateTier
from app.models.program import AffiliateProgram


def calculate_base_commission(
    conversion_value: Decimal,
    commission_config: dict
) -> Decimal:
    """
    Calculate base commission based on commission configuration

    Supported commission types:
    - percentage: X% of conversion value
    - fixed: Fixed amount per conversion
    - tiered: Different rates based on conversion value ranges
    """
    commission_type = commission_config.get("type", "percentage")

    if commission_type == "percentage":
        rate = Decimal(str(commission_config.get("value", 0)))
        return (conversion_value * rate) / Decimal("100")

    elif commission_type == "fixed":
        return Decimal(str(commission_config.get("amount", 0)))

    elif commission_type == "tiered":
        tiers = commission_config.get("tiers", [])
        for tier in tiers:
            min_value = Decimal(str(tier.get("min", 0)))
            max_value = tier.get("max")

            if max_value is None:
                # No upper limit
                if conversion_value >= min_value:
                    rate = Decimal(str(tier.get("rate", 0)))
                    return (conversion_value * rate) / Decimal("100")
            else:
                max_value = Decimal(str(max_value))
                if min_value <= conversion_value <= max_value:
                    rate = Decimal(str(tier.get("rate", 0)))
                    return (conversion_value * rate) / Decimal("100")

        # If no tier matches, return 0
        return Decimal("0")

    # Default to 0 if unknown type
    return Decimal("0")


def get_tier_multiplier(tier: Optional[AffiliateTier]) -> Decimal:
    """
    Get the commission multiplier for an affiliate tier
    """
    if tier:
        return Decimal(str(tier.commission_multiplier))
    return Decimal("1.0")


def create_commission_for_conversion(
    db: Session,
    conversion: Conversion,
    affiliate: AffiliateProfile,
    program: AffiliateProgram
) -> Commission:
    """
    Create a commission record for a validated conversion
    Automatically calculates commission based on program rules and affiliate tier
    """
    # Get commission configuration
    commission_config = program.commission_config

    # Calculate base commission
    base_amount = calculate_base_commission(
        conversion.conversion_value,
        commission_config
    )

    # Get tier multiplier
    tier = affiliate.tier if affiliate.tier_id else None
    tier_multiplier = get_tier_multiplier(tier)

    # Calculate final amount
    final_amount = base_amount * tier_multiplier

    # Create commission record
    commission = Commission(
        conversion_id=conversion.id,
        affiliate_id=affiliate.id,
        program_id=program.id,
        tier_id=affiliate.tier_id,
        commission_rule=commission_config,  # Snapshot of rule
        base_amount=base_amount,
        tier_multiplier=tier_multiplier,
        final_amount=final_amount,
        currency=conversion.currency,
        status=CommissionStatus.PENDING,
    )

    db.add(commission)
    db.commit()
    db.refresh(commission)

    return commission


def approve_commission(
    db: Session,
    commission: Commission,
    admin_user_id: str
) -> Commission:
    """
    Approve a commission for payment
    """
    from datetime import datetime

    commission.status = CommissionStatus.APPROVED
    commission.approved_by = admin_user_id
    commission.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(commission)

    return commission


def reject_commission(
    db: Session,
    commission: Commission,
    admin_user_id: str
) -> Commission:
    """
    Reject a commission
    """
    from datetime import datetime

    commission.status = CommissionStatus.REJECTED
    commission.approved_by = admin_user_id
    commission.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(commission)

    return commission


def calculate_affiliate_earnings(
    db: Session,
    affiliate_id: str,
    status: Optional[CommissionStatus] = None
) -> Decimal:
    """
    Calculate total earnings for an affiliate
    """
    query = db.query(Commission).filter(Commission.affiliate_id == affiliate_id)

    if status:
        query = query.filter(Commission.status == status)

    total = Decimal("0")
    for commission in query.all():
        total += commission.final_amount

    return total
