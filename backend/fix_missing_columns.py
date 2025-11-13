#!/usr/bin/env python3
"""
Manually fix missing columns in multiple tables
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

        print("\n🔧 Fixing missing columns in multiple tables...\n")

        # ===== FIX AFFILIATE_PROFILES TABLE =====
        print("=== Affiliate Profiles ===\n")

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

        # ===== FIX CONVERSIONS TABLE =====
        print("\n=== Conversions ===\n")

        # Check if currency column exists in conversions
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'conversions'
            AND column_name = 'currency'
        """)).fetchone()

        if not result:
            print("Adding currency column to conversions...")
            db.execute(text("""
                ALTER TABLE conversions
                ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' NOT NULL
            """))
            db.commit()
            print("✅ Added currency column to conversions")
        else:
            print("✅ currency column already exists in conversions")

        # Check if converted_at column exists in conversions
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'conversions'
            AND column_name = 'converted_at'
        """)).fetchone()

        if not result:
            print("Adding converted_at column to conversions...")
            db.execute(text("""
                ALTER TABLE conversions
                ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            """))
            db.commit()
            # Create index on converted_at
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_conversion_converted_at ON conversions(converted_at)
            """))
            db.commit()
            print("✅ Added converted_at column to conversions")
        else:
            print("✅ converted_at column already exists in conversions")

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
