"""
Affiliate Service - Business logic for affiliate operations
"""
import secrets
import string
from typing import Optional
from sqlalchemy.orm import Session

from app.models.affiliate import AffiliateProfile, AffiliateTier
from app.models.user import User


def generate_affiliate_code(length: int = 10) -> str:
    """
    Generate a unique affiliate code
    Format: AFF-XXXXXXXXXX
    """
    characters = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(characters) for _ in range(length))
    return f"AFF-{code}"


def ensure_unique_affiliate_code(db: Session, max_attempts: int = 10) -> str:
    """
    Generate a unique affiliate code that doesn't exist in the database
    """
    for _ in range(max_attempts):
        code = generate_affiliate_code()
        existing = db.query(AffiliateProfile).filter(
            AffiliateProfile.affiliate_code == code
        ).first()
        if not existing:
            return code

    # Fallback to a longer code if all attempts failed
    return generate_affiliate_code(length=15)


def get_default_tier(db: Session) -> Optional[AffiliateTier]:
    """
    Get the default (lowest level) affiliate tier
    """
    return db.query(AffiliateTier).order_by(AffiliateTier.level.asc()).first()


def create_affiliate_profile(
    db: Session,
    user: User,
    company_name: Optional[str] = None,
    website_url: Optional[str] = None,
    social_media: Optional[dict] = None,
) -> AffiliateProfile:
    """
    Create an affiliate profile for a user
    """
    affiliate_code = ensure_unique_affiliate_code(db)

    profile = AffiliateProfile(
        user_id=user.id,
        affiliate_code=affiliate_code,
        company_name=company_name,
        website_url=website_url,
        social_media=social_media or {},
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def approve_affiliate(
    db: Session,
    affiliate: AffiliateProfile,
    admin_user: User,
    tier_id: Optional[str] = None,
) -> AffiliateProfile:
    """
    Approve an affiliate application
    """
    from app.models.affiliate import ApprovalStatus
    from datetime import datetime

    affiliate.approval_status = ApprovalStatus.APPROVED
    affiliate.approved_by = admin_user.id
    affiliate.approved_at = datetime.utcnow()

    # Assign tier (default tier if not specified)
    if tier_id:
        affiliate.tier_id = tier_id
    elif not affiliate.tier_id:
        default_tier = get_default_tier(db)
        if default_tier:
            affiliate.tier_id = default_tier.id

    db.commit()
    db.refresh(affiliate)

    return affiliate


def reject_affiliate(
    db: Session,
    affiliate: AffiliateProfile,
    admin_user: User,
    reason: str,
) -> AffiliateProfile:
    """
    Reject an affiliate application
    """
    from app.models.affiliate import ApprovalStatus
    from datetime import datetime

    affiliate.approval_status = ApprovalStatus.REJECTED
    affiliate.approved_by = admin_user.id
    affiliate.approved_at = datetime.utcnow()
    affiliate.rejection_reason = reason

    db.commit()
    db.refresh(affiliate)

    return affiliate
