#!/usr/bin/env python3
"""
Database Reset Script
Run this before running alembic upgrade head to clear all existing database objects.

Usage:
    python reset_db.py
"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def reset_database():
    """Reset the database by dropping all tables and types"""
    try:
        # Create engine
        engine = create_engine(settings.DATABASE_URL)

        print("🔄 Connecting to database...")
        with engine.connect() as conn:
            # Clear alembic version
            print("📋 Clearing alembic version history...")
            conn.execute(text("DELETE FROM alembic_version"))
            conn.commit()

            # Drop all tables
            print("🗑️  Dropping all tables...")
            tables = [
                "payouts",
                "commissions",
                "conversions",
                "referral_clicks",
                "referral_links",
                "program_enrollments",
                "affiliate_programs",
                "affiliate_profiles",
                "affiliate_tiers",
                "users"
            ]

            for table in tables:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"   ✓ Dropped {table}")
            conn.commit()

            # Drop all enum types
            print("🗑️  Dropping all enum types...")
            types = [
                "payoutstatus",
                "commissionstatus",
                "conversionstatus",
                "conversiontype",
                "referrallinkstatus",
                "enrollmentstatus",
                "programstatus",
                "programtype",
                "approvalstatus",
                "userstatus",
                "userrole"
            ]

            for type_name in types:
                conn.execute(text(f"DROP TYPE IF EXISTS {type_name} CASCADE"))
                print(f"   ✓ Dropped {type_name}")
            conn.commit()

        print("\n✅ Database reset complete!")
        print("Now run: alembic upgrade head")
        return 0

    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(reset_database())
