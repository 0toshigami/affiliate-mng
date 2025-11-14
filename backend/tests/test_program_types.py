"""
Test suite for SaaS, Lead Generation, and Content/Media program types.

This test file demonstrates how conversions work for each program type.
Run with: pytest backend/tests/test_program_types.py -v
"""

import pytest
from decimal import Decimal
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models.program import ProgramType, AffiliateProgram
from app.models.conversion import ConversionType, Conversion, ConversionStatus
from app.models.affiliate import Affiliate, AffiliateTier
from app.models.referral import ReferralLink
from app.services import conversion_service, commission_service
from app.core.database import Base, engine


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_affiliate(db_session: Session):
    """Create a test affiliate."""
    affiliate = Affiliate(
        email="test@example.com",
        first_name="Test",
        last_name="Affiliate",
        tier=AffiliateTier.BRONZE
    )
    db_session.add(affiliate)
    db_session.commit()
    db_session.refresh(affiliate)
    return affiliate


class TestSaaSProgram:
    """Test conversions for SaaS program type."""

    @pytest.fixture
    def saas_program(self, db_session: Session):
        """Create a SaaS program with percentage commission."""
        program = AffiliateProgram(
            name="Test SaaS Product",
            description="Cloud-based software subscription",
            program_type=ProgramType.SAAS,
            commission_config={
                "type": "percentage",
                "value": 20  # 20% commission
            },
            cookie_duration_days=30
        )
        db_session.add(program)
        db_session.commit()
        db_session.refresh(program)
        return program

    @pytest.fixture
    def saas_referral_link(self, db_session: Session, test_affiliate, saas_program):
        """Create a referral link for SaaS program."""
        link = ReferralLink(
            affiliate_id=test_affiliate.id,
            program_id=saas_program.id,
            code=f"saas-{uuid4().hex[:8]}"
        )
        db_session.add(link)
        db_session.commit()
        db_session.refresh(link)
        return link

    def test_saas_sale_conversion(self, db_session: Session, saas_referral_link, saas_program):
        """Test SALE conversion for SaaS program."""
        # Create a sale conversion worth $500
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=saas_referral_link,
            conversion_type=ConversionType.SALE,
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("500.00"),
            conversion_metadata={
                "order_id": "ORD-12345",
                "plan": "Professional",
                "billing_cycle": "monthly"
            }
        )

        assert conversion.conversion_type == ConversionType.SALE
        assert conversion.conversion_value == Decimal("500.00")
        assert conversion.status == ConversionStatus.PENDING
        assert conversion.conversion_metadata["plan"] == "Professional"

        # Validate the conversion (creates commission)
        validated = conversion_service.validate_conversion(db_session, conversion.id)
        assert validated.status == ConversionStatus.VALIDATED

        # Check commission: $500 × 20% = $100
        commission = db_session.query(
            db_session.query(conversion_service.Commission)
            .filter_by(conversion_id=conversion.id)
            .first()
        )

        # Note: Bronze tier has 1.0x multiplier (no bonus)
        expected_commission = Decimal("500.00") * Decimal("0.20")  # $100
        assert commission.base_amount == expected_commission
        assert commission.final_amount == expected_commission

    def test_saas_signup_conversion(self, db_session: Session, saas_referral_link):
        """Test SIGNUP conversion for SaaS program (trial signup)."""
        # Create a signup conversion (free trial, $0 value)
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=saas_referral_link,
            conversion_type=ConversionType.SIGNUP,
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("0.00"),
            conversion_metadata={
                "trial_days": 14,
                "plan": "Professional",
                "email": "customer@example.com"
            }
        )

        assert conversion.conversion_type == ConversionType.SIGNUP
        assert conversion.conversion_value == Decimal("0.00")
        assert conversion.conversion_metadata["trial_days"] == 14


class TestLeadGenerationProgram:
    """Test conversions for Lead Generation program type."""

    @pytest.fixture
    def leadgen_program(self, db_session: Session):
        """Create a Lead Gen program with fixed commission."""
        program = AffiliateProgram(
            name="Insurance Leads",
            description="Generate qualified insurance leads",
            program_type=ProgramType.LEAD_GEN,
            commission_config={
                "type": "fixed",
                "amount": 25  # $25 per lead
            },
            cookie_duration_days=7  # Shorter attribution window
        )
        db_session.add(program)
        db_session.commit()
        db_session.refresh(program)
        return program

    @pytest.fixture
    def leadgen_referral_link(self, db_session: Session, test_affiliate, leadgen_program):
        """Create a referral link for Lead Gen program."""
        link = ReferralLink(
            affiliate_id=test_affiliate.id,
            program_id=leadgen_program.id,
            code=f"leadgen-{uuid4().hex[:8]}"
        )
        db_session.add(link)
        db_session.commit()
        db_session.refresh(link)
        return link

    def test_leadgen_lead_conversion(self, db_session: Session, leadgen_referral_link):
        """Test LEAD conversion for Lead Generation program."""
        # Create a lead conversion (no monetary value, fixed commission)
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=leadgen_referral_link,
            conversion_type=ConversionType.LEAD,
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("0.00"),  # Leads have no sale value
            conversion_metadata={
                "lead_source": "blog_article",
                "lead_quality": "high",
                "phone": "+1234567890",
                "verified": True
            }
        )

        assert conversion.conversion_type == ConversionType.LEAD
        assert conversion.conversion_value == Decimal("0.00")
        assert conversion.conversion_metadata["lead_quality"] == "high"

        # Validate and check commission: Fixed $25
        conversion_service.validate_conversion(db_session, conversion.id)

        commission = db_session.query(
            conversion_service.Commission
        ).filter_by(conversion_id=conversion.id).first()

        assert commission.base_amount == Decimal("25.00")
        assert commission.final_amount == Decimal("25.00")

    def test_leadgen_multiple_leads(self, db_session: Session, leadgen_referral_link):
        """Test multiple lead conversions earn consistent commission."""
        lead_qualities = ["high", "medium", "low"]

        for quality in lead_qualities:
            conversion = conversion_service.create_conversion(
                db=db_session,
                referral_link=leadgen_referral_link,
                conversion_type=ConversionType.LEAD,
                visitor_session_id=str(uuid4()),
                conversion_value=Decimal("0.00"),
                conversion_metadata={"lead_quality": quality}
            )

            conversion_service.validate_conversion(db_session, conversion.id)

        # All leads should get same $25 commission regardless of quality
        commissions = db_session.query(
            conversion_service.Commission
        ).filter_by(affiliate_id=leadgen_referral_link.affiliate_id).all()

        assert len(commissions) == 3
        for commission in commissions:
            assert commission.base_amount == Decimal("25.00")


class TestContentMediaProgram:
    """Test conversions for Content/Media program type."""

    @pytest.fixture
    def content_program(self, db_session: Session):
        """Create a Content/Media program with tiered commission."""
        program = AffiliateProgram(
            name="Premium Content Platform",
            description="Promote premium articles and videos",
            program_type=ProgramType.CONTENT_MEDIA,
            commission_config={
                "type": "tiered",
                "tiers": [
                    {"min": 0, "max": 100, "rate": 10},      # 10% for $0-100
                    {"min": 100, "max": 500, "rate": 15},    # 15% for $100-500
                    {"min": 500, "rate": 20}                  # 20% for $500+
                ]
            },
            cookie_duration_days=14
        )
        db_session.add(program)
        db_session.commit()
        db_session.refresh(program)
        return program

    @pytest.fixture
    def content_referral_link(self, db_session: Session, test_affiliate, content_program):
        """Create a referral link for Content/Media program."""
        link = ReferralLink(
            affiliate_id=test_affiliate.id,
            program_id=content_program.id,
            code=f"content-{uuid4().hex[:8]}"
        )
        db_session.add(link)
        db_session.commit()
        db_session.refresh(link)
        return link

    def test_content_signup_tier1(self, db_session: Session, content_referral_link):
        """Test SIGNUP conversion in tier 1 (10% rate)."""
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=content_referral_link,
            conversion_type=ConversionType.SIGNUP,
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("50.00"),  # Basic subscription
            conversion_metadata={
                "subscription_type": "basic",
                "content_type": "articles",
                "duration": "monthly"
            }
        )

        conversion_service.validate_conversion(db_session, conversion.id)

        commission = db_session.query(
            conversion_service.Commission
        ).filter_by(conversion_id=conversion.id).first()

        # $50 × 10% = $5
        assert commission.base_amount == Decimal("5.00")

    def test_content_signup_tier2(self, db_session: Session, content_referral_link):
        """Test SIGNUP conversion in tier 2 (15% rate)."""
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=content_referral_link,
            conversion_type=ConversionType.SIGNUP,
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("150.00"),  # Premium subscription
            conversion_metadata={
                "subscription_type": "premium",
                "content_type": "videos+articles"
            }
        )

        conversion_service.validate_conversion(db_session, conversion.id)

        commission = db_session.query(
            conversion_service.Commission
        ).filter_by(conversion_id=conversion.id).first()

        # $150 × 15% = $22.50
        assert commission.base_amount == Decimal("22.50")

    def test_content_custom_conversion(self, db_session: Session, content_referral_link):
        """Test CUSTOM conversion for special content engagement."""
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=content_referral_link,
            conversion_type=ConversionType.CUSTOM,
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("75.00"),
            conversion_metadata={
                "event_type": "workshop_ticket",
                "workshop_name": "Advanced Photography",
                "attendees": 1
            }
        )

        assert conversion.conversion_type == ConversionType.CUSTOM
        assert conversion.conversion_metadata["event_type"] == "workshop_ticket"


class TestProgramTypeFlexibility:
    """Test that program types don't enforce conversion types (flexible design)."""

    def test_saas_can_use_lead_conversion(self, db_session: Session, test_affiliate):
        """Verify SaaS programs can track LEAD conversions (system is flexible)."""
        program = AffiliateProgram(
            name="SaaS with Lead Tracking",
            program_type=ProgramType.SAAS,
            commission_config={"type": "fixed", "amount": 10}
        )
        db_session.add(program)
        db_session.commit()

        link = ReferralLink(
            affiliate_id=test_affiliate.id,
            program_id=program.id,
            code="flexible-test"
        )
        db_session.add(link)
        db_session.commit()

        # SaaS program can accept LEAD conversion (no validation prevents it)
        conversion = conversion_service.create_conversion(
            db=db_session,
            referral_link=link,
            conversion_type=ConversionType.LEAD,  # Different type
            visitor_session_id=str(uuid4()),
            conversion_value=Decimal("0.00")
        )

        assert conversion.conversion_type == ConversionType.LEAD
        # This demonstrates the system's flexibility - no type enforcement


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
