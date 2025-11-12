"""
Conversion Service - Business logic for conversion tracking
"""
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.conversion import Conversion, ConversionType, ConversionStatus
from app.models.referral import ReferralLink
from app.models.affiliate import AffiliateProfile
from app.models.program import AffiliateProgram
from app.services.commission_service import create_commission_for_conversion
from app.services.referral_service import increment_conversion_count


def create_conversion(
    db: Session,
    referral_link: ReferralLink,
    conversion_type: ConversionType,
    visitor_session_id: str,
    conversion_value: Decimal = Decimal("0"),
    customer_id: Optional[str] = None,
    conversion_metadata: Optional[dict] = None,
    auto_validate: bool = False,
) -> Conversion:
    """
    Create a new conversion record

    Args:
        db: Database session
        referral_link: The referral link used
        conversion_type: Type of conversion (sale, lead, signup, custom)
        visitor_session_id: Session ID from original click
        conversion_value: Monetary value of conversion
        customer_id: Optional customer/user ID
        conversion_metadata: Additional conversion data
        auto_validate: Automatically validate and create commission
    """
    conversion = Conversion(
        referral_link_id=referral_link.id,
        affiliate_id=referral_link.affiliate_id,
        program_id=referral_link.program_id,
        customer_id=customer_id,
        conversion_type=conversion_type,
        visitor_session_id=visitor_session_id,
        conversion_value=conversion_value,
        conversion_metadata=conversion_metadata or {},
        status=ConversionStatus.VALIDATED if auto_validate else ConversionStatus.PENDING,
    )

    db.add(conversion)
    db.commit()
    db.refresh(conversion)

    # Increment conversion count on referral link
    increment_conversion_count(db, referral_link)

    # Auto-create commission if validated
    if auto_validate:
        affiliate = db.query(AffiliateProfile).filter(
            AffiliateProfile.id == referral_link.affiliate_id
        ).first()
        program = db.query(AffiliateProgram).filter(
            AffiliateProgram.id == referral_link.program_id
        ).first()

        if affiliate and program:
            create_commission_for_conversion(db, conversion, affiliate, program)

    return conversion


def validate_conversion(
    db: Session,
    conversion: Conversion,
) -> Conversion:
    """
    Validate a pending conversion and create commission
    """
    if conversion.status != ConversionStatus.PENDING:
        raise ValueError(f"Conversion {conversion.id} is not pending")

    conversion.status = ConversionStatus.VALIDATED
    conversion.validated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversion)

    # Get affiliate and program
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.id == conversion.affiliate_id
    ).first()
    program = db.query(AffiliateProgram).filter(
        AffiliateProgram.id == conversion.program_id
    ).first()

    if affiliate and program:
        create_commission_for_conversion(db, conversion, affiliate, program)

    return conversion


def reject_conversion(
    db: Session,
    conversion: Conversion,
) -> Conversion:
    """
    Reject a conversion (no commission will be created)
    """
    conversion.status = ConversionStatus.REJECTED
    db.commit()
    db.refresh(conversion)

    return conversion


def reverse_conversion(
    db: Session,
    conversion: Conversion,
) -> Conversion:
    """
    Reverse a conversion (e.g., refund, chargeback)
    This will also reject any associated commission
    """
    conversion.status = ConversionStatus.REVERSED
    db.commit()

    # Reject associated commission if exists
    if conversion.commission:
        from app.models.conversion import CommissionStatus
        conversion.commission.status = CommissionStatus.REJECTED
        db.commit()

    db.refresh(conversion)
    return conversion
