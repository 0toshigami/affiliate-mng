#!/usr/bin/env python3
"""
Check existing enum types in the database
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def main():
    """Check enum types"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")

        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        # Check all enum types
        result = db.execute(text("""
            SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typtype = 'e'
            GROUP BY t.typname
            ORDER BY t.typname
        """)).fetchall()

        print("\n📋 Existing enum types:")
        for row in result:
            print(f"  - {row[0]}: {row[1]}")

        # Check if paymentmethod exists
        result = db.execute(text("""
            SELECT typname FROM pg_type WHERE typname = 'paymentmethod'
        """)).fetchone()

        if result:
            print(f"\n✅ paymentmethod enum exists")
        else:
            print(f"\n❌ paymentmethod enum does NOT exist")

        db.close()
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
