"""
Database Seeding Utilities
"""
from sqlalchemy.orm import Session

from app.models.affiliate import AffiliateTier
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.core.config import settings


def seed_affiliate_tiers(db: Session) -> None:
    """
    Seed default affiliate tiers if they don't exist
    """
    tiers_data = [
        {
            "name": "Bronze",
            "level": 1,
            "commission_multiplier": 1.0,
            "requirements": {
                "min_monthly_conversions": 0,
                "min_monthly_revenue": 0,
            },
            "benefits": {
                "features": ["Basic dashboard", "Standard commission rates", "Email support"],
            },
        },
        {
            "name": "Silver",
            "level": 2,
            "commission_multiplier": 1.2,
            "requirements": {
                "min_monthly_conversions": 10,
                "min_monthly_revenue": 1000,
            },
            "benefits": {
                "features": [
                    "Advanced dashboard",
                    "20% commission bonus",
                    "Priority support",
                    "Custom marketing materials",
                ],
            },
        },
        {
            "name": "Gold",
            "level": 3,
            "commission_multiplier": 1.5,
            "requirements": {
                "min_monthly_conversions": 50,
                "min_monthly_revenue": 5000,
            },
            "benefits": {
                "features": [
                    "Premium dashboard",
                    "50% commission bonus",
                    "Dedicated account manager",
                    "Custom landing pages",
                    "Early access to new programs",
                ],
            },
        },
        {
            "name": "Platinum",
            "level": 4,
            "commission_multiplier": 2.0,
            "requirements": {
                "min_monthly_conversions": 100,
                "min_monthly_revenue": 10000,
            },
            "benefits": {
                "features": [
                    "VIP dashboard",
                    "100% commission bonus",
                    "Personal account manager",
                    "Custom integration support",
                    "Co-marketing opportunities",
                    "Exclusive programs",
                ],
            },
        },
    ]

    for tier_data in tiers_data:
        # Check if tier already exists
        existing = db.query(AffiliateTier).filter(
            AffiliateTier.name == tier_data["name"]
        ).first()

        if not existing:
            tier = AffiliateTier(**tier_data)
            db.add(tier)
            print(f"Created affiliate tier: {tier_data['name']}")
        else:
            print(f"Affiliate tier already exists: {tier_data['name']}")

    db.commit()


def seed_admin_user(db: Session) -> None:
    """
    Create the first admin user if it doesn't exist
    """
    existing = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()

    if not existing:
        admin = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
        )
        db.add(admin)
        db.commit()
        print(f"Created admin user: {settings.FIRST_SUPERUSER_EMAIL}")
    else:
        print(f"Admin user already exists: {settings.FIRST_SUPERUSER_EMAIL}")


def seed_database(db: Session) -> None:
    """
    Seed the database with initial data
    """
    print("Seeding database...")
    seed_affiliate_tiers(db)
    seed_admin_user(db)
    print("Database seeding complete!")
