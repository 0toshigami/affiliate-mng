#!/usr/bin/env python3
"""
Quick script to activate admin user
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def main():
    """Activate admin user"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")

        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        # Update admin user status
        admin_email = "admin@example.com"

        # Check current status
        result = db.execute(
            text("SELECT email, role, status FROM users WHERE email = :email"),
            {"email": admin_email}
        ).fetchone()

        if result:
            print(f"Current status: {result}")

            # Update to ACTIVE
            db.execute(
                text("UPDATE users SET status = 'ACTIVE' WHERE email = :email"),
                {"email": admin_email}
            )
            db.commit()

            # Verify
            result = db.execute(
                text("SELECT email, role, status FROM users WHERE email = :email"),
                {"email": admin_email}
            ).fetchone()

            print(f"✅ Updated status: {result}")
            print(f"\n🎉 Admin user is now ACTIVE!")
        else:
            print(f"❌ Admin user not found: {admin_email}")

        db.close()
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
