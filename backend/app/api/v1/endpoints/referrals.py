"""
Referral Link Management Endpoints
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_active_user, get_affiliate_user
from app.core.config import settings
from app.core.exceptions import NotFoundError, BadRequestError, AuthorizationError
from app.models.user import User, UserRole
from app.models.affiliate import AffiliateProfile, ApprovalStatus
from app.models.program import ProgramEnrollment, EnrollmentStatus
from app.models.referral import ReferralLink, ReferralClick, ReferralLinkStatus
from app.schemas.referral import (
    ReferralLink as ReferralLinkSchema,
    ReferralLinkCreate,
    ReferralLinkUpdate,
    ReferralLinkWithUrl,
    ReferralLinkStats,
)
from app.services.referral_service import (
    create_referral_link,
    build_tracking_url,
    increment_click_count,
)

router = APIRouter()


@router.post("/links", response_model=ReferralLinkWithUrl)
def generate_referral_link(
    link_data: ReferralLinkCreate,
    request: Request,
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    Generate a new referral link for a program
    """
    # Get affiliate profile
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate:
        raise BadRequestError("Affiliate profile not found")

    if affiliate.approval_status != ApprovalStatus.APPROVED:
        raise BadRequestError("Your affiliate application must be approved first")

    # Check if enrolled in the program
    enrollment = db.query(ProgramEnrollment).filter(
        ProgramEnrollment.affiliate_id == affiliate.id,
        ProgramEnrollment.program_id == link_data.program_id,
        ProgramEnrollment.status == EnrollmentStatus.ACTIVE,
    ).first()

    if not enrollment:
        raise BadRequestError("You must be enrolled in this program to create referral links")

    # Create referral link
    link = create_referral_link(
        db=db,
        enrollment=enrollment,
        target_url=link_data.target_url,
        utm_params=link_data.utm_params,
        link_metadata=link_data.link_metadata,
        expires_at=link_data.expires_at,
    )

    # Build full tracking URL
    # Use request host or configured base URL
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    full_url = build_tracking_url(base_url, link.link_code)

    # Return link with full URL
    link_dict = {
        **ReferralLinkSchema.model_validate(link).model_dump(),
        "full_url": full_url,
    }

    return ReferralLinkWithUrl(**link_dict)


@router.get("/links", response_model=List[ReferralLinkSchema])
def list_my_referral_links(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[ReferralLinkStatus] = Query(None),
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    List current affiliate's referral links
    """
    # Get affiliate profile
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate:
        return []

    query = db.query(ReferralLink).filter(
        ReferralLink.affiliate_id == affiliate.id
    )

    if status:
        query = query.filter(ReferralLink.status == status)

    links = query.offset(skip).limit(limit).all()
    return links


@router.get("/links/{link_id}", response_model=ReferralLinkWithUrl)
def get_referral_link(
    link_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get referral link by ID
    """
    link = db.query(ReferralLink).filter(ReferralLink.id == link_id).first()

    if not link:
        raise NotFoundError("Referral link not found")

    # Check authorization
    if current_user.role != UserRole.ADMIN and link.affiliate_id != str(
        db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first().id if db.query(AffiliateProfile).filter(
            AffiliateProfile.user_id == current_user.id
        ).first() else None
    ):
        raise AuthorizationError("You can only view your own referral links")

    # Build full tracking URL
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    full_url = build_tracking_url(base_url, link.link_code)

    link_dict = {
        **ReferralLinkSchema.model_validate(link).model_dump(),
        "full_url": full_url,
    }

    return ReferralLinkWithUrl(**link_dict)


@router.patch("/links/{link_id}", response_model=ReferralLinkSchema)
def update_referral_link(
    link_id: UUID,
    link_update: ReferralLinkUpdate,
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    Update a referral link
    """
    link = db.query(ReferralLink).filter(ReferralLink.id == link_id).first()

    if not link:
        raise NotFoundError("Referral link not found")

    # Check authorization
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate or link.affiliate_id != affiliate.id:
        raise AuthorizationError("You can only update your own referral links")

    # Update fields
    update_data = link_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(link, field, value)

    db.commit()
    db.refresh(link)

    return link


@router.delete("/links/{link_id}")
def delete_referral_link(
    link_id: UUID,
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    Delete (deactivate) a referral link
    """
    link = db.query(ReferralLink).filter(ReferralLink.id == link_id).first()

    if not link:
        raise NotFoundError("Referral link not found")

    # Check authorization
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate or link.affiliate_id != affiliate.id:
        raise AuthorizationError("You can only delete your own referral links")

    # Soft delete by deactivating
    link.status = ReferralLinkStatus.INACTIVE
    db.commit()

    return {"message": "Referral link deactivated successfully"}


@router.get("/links/{link_id}/stats", response_model=ReferralLinkStats)
def get_referral_link_stats(
    link_id: UUID,
    current_user: User = Depends(get_affiliate_user),
    db: Session = Depends(get_db),
):
    """
    Get statistics for a referral link
    """
    link = db.query(ReferralLink).filter(ReferralLink.id == link_id).first()

    if not link:
        raise NotFoundError("Referral link not found")

    # Check authorization
    affiliate = db.query(AffiliateProfile).filter(
        AffiliateProfile.user_id == current_user.id
    ).first()

    if not affiliate or link.affiliate_id != affiliate.id:
        raise AuthorizationError("You can only view stats for your own referral links")

    # Calculate unique visitors
    unique_visitors = db.query(func.count(func.distinct(ReferralClick.visitor_session_id))).filter(
        ReferralClick.referral_link_id == link.id
    ).scalar() or 0

    # Get last click time
    last_click = db.query(func.max(ReferralClick.clicked_at)).filter(
        ReferralClick.referral_link_id == link.id
    ).scalar()

    # Calculate conversion rate
    conversion_rate = (link.conversions_count / link.clicks_count * 100) if link.clicks_count > 0 else 0.0

    return ReferralLinkStats(
        link_code=link.link_code,
        total_clicks=link.clicks_count,
        unique_visitors=unique_visitors,
        conversions=link.conversions_count,
        conversion_rate=round(conversion_rate, 2),
        last_click_at=last_click,
    )


# ===== Public Tracking Endpoint =====

@router.get("/verify/{link_code}")
async def verify_referral_link(
    link_code: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint to verify if a referral link exists and is active
    No authentication required - used by SDK
    """
    link = db.query(ReferralLink).filter(
        ReferralLink.link_code == link_code,
        ReferralLink.status == ReferralLinkStatus.ACTIVE,
    ).first()

    if not link:
        return {"valid": False, "message": "Referral link not found or inactive"}

    # Check if link is expired
    if link.expires_at and link.expires_at < datetime.utcnow():
        return {"valid": False, "message": "Referral link has expired"}

    return {
        "valid": True,
        "program_id": str(link.program_id),
        "affiliate_id": str(link.affiliate_id),
    }


@router.get("/track/{link_code}")
async def track_referral_click(
    link_code: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public endpoint to track clicks and redirect to target URL
    No authentication required
    """
    # Find the referral link
    link = db.query(ReferralLink).filter(
        ReferralLink.link_code == link_code,
        ReferralLink.status == ReferralLinkStatus.ACTIVE,
    ).first()

    if not link:
        # Return 404 or redirect to default page
        raise NotFoundError("Referral link not found or expired")

    # Check if link is expired
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise NotFoundError("Referral link has expired")

    # Create click record
    click = ReferralClick(
        referral_link_id=link.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        referrer_url=request.headers.get("referer"),
    )

    db.add(click)

    # Increment click count
    increment_click_count(db, link)

    # Build target URL with UTM params
    target_url = link.target_url

    if link.utm_params:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

        parsed = urlparse(target_url)
        query_params = parse_qs(parsed.query)

        # Add UTM parameters
        for key, value in link.utm_params.items():
            query_params[key] = [value]

        # Add tracking parameters
        query_params['ref'] = [link_code]

        # Rebuild URL
        new_query = urlencode(query_params, doseq=True)
        target_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        ))

    # Redirect to target URL
    return RedirectResponse(url=target_url, status_code=302)
