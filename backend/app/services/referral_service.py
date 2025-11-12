"""
Referral Service - Business logic for referral link operations
"""
import secrets
import string
from typing import Optional
from sqlalchemy.orm import Session

from app.models.referral import ReferralLink
from app.models.program import ProgramEnrollment


def generate_link_code(length: int = 8) -> str:
    """
    Generate a random link code
    """
    characters = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


def ensure_unique_link_code(db: Session, max_attempts: int = 10) -> str:
    """
    Generate a unique link code that doesn't exist in the database
    """
    for _ in range(max_attempts):
        code = generate_link_code()
        existing = db.query(ReferralLink).filter(
            ReferralLink.link_code == code
        ).first()
        if not existing:
            return code

    # Fallback to a longer code if all attempts failed
    return generate_link_code(length=12)


def create_referral_link(
    db: Session,
    enrollment: ProgramEnrollment,
    target_url: str,
    utm_params: Optional[dict] = None,
    metadata: Optional[dict] = None,
    expires_at: Optional[str] = None,
) -> ReferralLink:
    """
    Create a referral link for an enrollment
    """
    link_code = ensure_unique_link_code(db)

    link = ReferralLink(
        enrollment_id=enrollment.id,
        affiliate_id=enrollment.affiliate_id,
        program_id=enrollment.program_id,
        link_code=link_code,
        target_url=target_url,
        utm_params=utm_params or {},
        metadata=metadata or {},
        expires_at=expires_at,
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    return link


def build_tracking_url(base_url: str, link_code: str) -> str:
    """
    Build the full tracking URL for a referral link
    """
    # Remove trailing slash from base_url
    base_url = base_url.rstrip('/')
    return f"{base_url}/track/{link_code}"


def increment_click_count(db: Session, referral_link: ReferralLink) -> None:
    """
    Increment the click count for a referral link
    """
    referral_link.clicks_count += 1
    db.commit()


def increment_conversion_count(db: Session, referral_link: ReferralLink) -> None:
    """
    Increment the conversion count for a referral link
    """
    referral_link.conversions_count += 1
    db.commit()
