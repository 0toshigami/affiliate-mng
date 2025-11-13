#!/usr/bin/env python3
"""
Manually fix missing columns in affiliate_profiles
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def main():
    """Fix missing columns"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")

        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        print("\n🔧 Fixing missing columns in affiliate_profiles...\n")

        # Check if paymentmethod enum exists
        result = db.execute(text("""
            SELECT typname FROM pg_type WHERE typname = 'paymentmethod'
        """)).fetchone()

        if not result:
            print("Creating paymentmethod enum...")
            db.execute(text("""
                CREATE TYPE paymentmethod AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'STRIPE')
            """))
            db.commit()
            print("✅ Created paymentmethod enum")
        else:
            print("✅ paymentmethod enum already exists")

        # Check if payment_method column exists
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'affiliate_profiles'
            AND column_name = 'payment_method'
        """)).fetchone()

        if not result:
            print("Adding payment_method column...")
            db.execute(text("""
                ALTER TABLE affiliate_profiles
                ADD COLUMN payment_method paymentmethod
            """))
            db.commit()
            print("✅ Added payment_method column")
        else:
            print("✅ payment_method column already exists")

        # Check if payment_details column exists
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'affiliate_profiles'
            AND column_name = 'payment_details'
        """)).fetchone()

        if not result:
            print("Adding payment_details column...")
            db.execute(text("""
                ALTER TABLE affiliate_profiles
                ADD COLUMN payment_details JSONB DEFAULT '{}'
            """))
            db.commit()
            print("✅ Added payment_details column")
        else:
            print("✅ payment_details column already exists")

        # Check if tax_info column exists
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'affiliate_profiles'
            AND column_name = 'tax_info'
        """)).fetchone()

        if not result:
            print("Adding tax_info column...")
            db.execute(text("""
                ALTER TABLE affiliate_profiles
                ADD COLUMN tax_info JSONB DEFAULT '{}'
            """))
            db.commit()
            print("✅ Added tax_info column")
        else:
            print("✅ tax_info column already exists")

        print("\n🎉 All columns fixed!")

        db.close()
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
