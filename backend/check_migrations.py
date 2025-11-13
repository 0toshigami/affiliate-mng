#!/usr/bin/env python3
"""
Check current migration status
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def main():
    """Check migration status"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")

        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        # Check current migration version
        result = db.execute(text("SELECT version_num FROM alembic_version")).fetchone()

        if result:
            print(f"✅ Current migration version: {result[0]}")
        else:
            print(f"❌ No migrations applied yet")

        # Check if payment_method column exists
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'affiliate_profiles'
            AND column_name = 'payment_method'
        """)).fetchone()

        if result:
            print(f"✅ payment_method column exists in affiliate_profiles")
        else:
            print(f"❌ payment_method column MISSING in affiliate_profiles")
            print(f"\n⚠️  You need to run: alembic upgrade head")

        # Check if commission_rule column exists
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'commissions'
            AND column_name = 'commission_rule'
        """)).fetchone()

        if result:
            print(f"✅ commission_rule column exists in commissions")
        else:
            print(f"❌ commission_rule column MISSING in commissions")
            print(f"\n⚠️  You need to run: alembic upgrade head")

        db.close()
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
