#!/usr/bin/env python3
"""
Fix enum values in the database to use lowercase
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def main():
    """Fix enum values"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")

        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        # Check current enum values
        print("\nChecking current enum values...")
        result = db.execute(text("""
            SELECT enumlabel
            FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')
            ORDER BY enumsortorder
        """)).fetchall()

        print(f"Current userrole values: {[r[0] for r in result]}")

        result = db.execute(text("""
            SELECT enumlabel
            FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userstatus')
            ORDER BY enumsortorder
        """)).fetchall()

        print(f"Current userstatus values: {[r[0] for r in result]}")

        # Check if we need to fix the values
        has_uppercase = any(r[0].isupper() for r in result)

        if has_uppercase:
            print("\n⚠️  Found uppercase enum values. Fixing...")

            # Drop and recreate enums with correct values
            db.execute(text("DROP TYPE IF EXISTS userrole CASCADE"))
            db.execute(text("DROP TYPE IF EXISTS userstatus CASCADE"))
            db.execute(text("DROP TYPE IF EXISTS affiliatestatus CASCADE"))
            db.execute(text("DROP TYPE IF EXISTS programstatus CASCADE"))
            db.execute(text("DROP TYPE IF EXISTS commissiontype CASCADE"))
            db.execute(text("DROP TYPE IF EXISTS commissionstatus CASCADE"))
            db.execute(text("DROP TYPE IF EXISTS payoutstatus CASCADE"))

            db.execute(text("CREATE TYPE userrole AS ENUM ('admin', 'affiliate', 'customer')"))
            db.execute(text("CREATE TYPE userstatus AS ENUM ('active', 'inactive', 'suspended')"))
            db.execute(text("CREATE TYPE affiliatestatus AS ENUM ('pending', 'approved', 'rejected', 'suspended')"))
            db.execute(text("CREATE TYPE programstatus AS ENUM ('draft', 'active', 'paused', 'archived')"))
            db.execute(text("CREATE TYPE commissiontype AS ENUM ('percentage', 'fixed', 'tiered')"))
            db.execute(text("CREATE TYPE commissionstatus AS ENUM ('pending', 'approved', 'rejected', 'paid')"))
            db.execute(text("CREATE TYPE payoutstatus AS ENUM ('pending', 'processing', 'completed', 'failed')"))

            db.commit()
            print("✅ Enum types recreated with lowercase values")
            print("⚠️  Note: All tables using these enums have been dropped. You need to run 'alembic upgrade head' to recreate them.")
        else:
            print("✅ Enum values are already correct (lowercase)")

        db.close()
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
