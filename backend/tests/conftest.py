"""
Pytest configuration and shared fixtures for all tests.

This file is automatically loaded by pytest and provides:
- Database setup/teardown
- Test client
- Common fixtures (admin user, test data)
"""

import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.models.affiliate import Affiliate, AffiliateTier
from app.models.program import AffiliateProgram, ProgramType
from app.core.security import get_password_hash


# Test database URL (use in-memory SQLite for speed)
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create test session factory
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test function.

    This fixture:
    1. Creates all tables
    2. Yields a database session
    3. Drops all tables after the test

    Scope: function (new DB for each test)
    """
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    # Create session
    db = TestSessionLocal()

    try:
        yield db
    finally:
        db.close()
        # Drop all tables
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Create a FastAPI test client with database override.

    This allows testing API endpoints with a test database.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session: Session) -> User:
    """Create an admin user for testing."""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("admin123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(client: TestClient, admin_user: User) -> str:
    """Get an admin authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": admin_user.email,
            "password": "admin123"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token: str) -> dict:
    """Get headers with admin authentication."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_affiliate(db_session: Session) -> Affiliate:
    """Create a test affiliate."""
    affiliate = Affiliate(
        email="affiliate@test.com",
        first_name="Test",
        last_name="Affiliate",
        company_name="Test Company",
        tier=AffiliateTier.BRONZE
    )
    db_session.add(affiliate)
    db_session.commit()
    db_session.refresh(affiliate)
    return affiliate


@pytest.fixture
def bronze_affiliate(db_session: Session) -> Affiliate:
    """Create a Bronze tier affiliate (1.0x multiplier)."""
    affiliate = Affiliate(
        email="bronze@test.com",
        first_name="Bronze",
        last_name="Affiliate",
        tier=AffiliateTier.BRONZE
    )
    db_session.add(affiliate)
    db_session.commit()
    db_session.refresh(affiliate)
    return affiliate


@pytest.fixture
def silver_affiliate(db_session: Session) -> Affiliate:
    """Create a Silver tier affiliate (1.25x multiplier)."""
    affiliate = Affiliate(
        email="silver@test.com",
        first_name="Silver",
        last_name="Affiliate",
        tier=AffiliateTier.SILVER
    )
    db_session.add(affiliate)
    db_session.commit()
    db_session.refresh(affiliate)
    return affiliate


@pytest.fixture
def gold_affiliate(db_session: Session) -> Affiliate:
    """Create a Gold tier affiliate (1.5x multiplier)."""
    affiliate = Affiliate(
        email="gold@test.com",
        first_name="Gold",
        last_name="Affiliate",
        tier=AffiliateTier.GOLD
    )
    db_session.add(affiliate)
    db_session.commit()
    db_session.refresh(affiliate)
    return affiliate


@pytest.fixture
def saas_program(db_session: Session) -> AffiliateProgram:
    """Create a SaaS program with percentage commission."""
    program = AffiliateProgram(
        name="Test SaaS Product",
        description="Cloud-based software",
        program_type=ProgramType.SAAS,
        commission_config={
            "type": "percentage",
            "value": 20
        },
        cookie_duration_days=30
    )
    db_session.add(program)
    db_session.commit()
    db_session.refresh(program)
    return program


@pytest.fixture
def leadgen_program(db_session: Session) -> AffiliateProgram:
    """Create a Lead Generation program with fixed commission."""
    program = AffiliateProgram(
        name="Insurance Leads",
        description="Generate qualified leads",
        program_type=ProgramType.LEAD_GEN,
        commission_config={
            "type": "fixed",
            "amount": 25
        },
        cookie_duration_days=7
    )
    db_session.add(program)
    db_session.commit()
    db_session.refresh(program)
    return program


@pytest.fixture
def content_program(db_session: Session) -> AffiliateProgram:
    """Create a Content/Media program with tiered commission."""
    program = AffiliateProgram(
        name="Premium Content",
        description="Promote premium content",
        program_type=ProgramType.CONTENT_MEDIA,
        commission_config={
            "type": "tiered",
            "tiers": [
                {"min": 0, "max": 100, "rate": 10},
                {"min": 100, "max": 500, "rate": 15},
                {"min": 500, "rate": 20}
            ]
        },
        cookie_duration_days=14
    )
    db_session.add(program)
    db_session.commit()
    db_session.refresh(program)
    return program


# Pytest markers for test organization
def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "api: marks tests as API tests"
    )
    config.addinivalue_line(
        "markers", "saas: marks tests for SaaS program type"
    )
    config.addinivalue_line(
        "markers", "leadgen: marks tests for Lead Gen program type"
    )
    config.addinivalue_line(
        "markers", "content: marks tests for Content/Media program type"
    )
