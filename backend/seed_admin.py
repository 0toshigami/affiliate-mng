#!/usr/bin/env python3
"""
Direct admin user creation script - bypasses any cache issues
"""
import sys
import uuid
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password"""
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def main():
    """Create admin user directly"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")
        
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()
        
        # Admin credentials
        admin_email = "admin@example.com"
        admin_password = "changeme123"
        
        # Check if admin exists
        result = db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": admin_email}
        ).fetchone()
        
        if result:
            print(f"✓ Admin user already exists: {admin_email}")
            db.close()
            return 0
        
        # Create admin user
        admin_id = str(uuid.uuid4())
        hashed_password = get_password_hash(admin_password)
        now = datetime.utcnow()
        
        db.execute(
            text("""
                INSERT INTO users (id, email, hashed_password, first_name, last_name, role, status, created_at, updated_at)
                VALUES (CAST(:id AS UUID), :email, :password, :first_name, :last_name, :role, :status, :created_at, :updated_at)
            """),
            {
                "id": admin_id,
                "email": admin_email,
                "password": hashed_password,
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin",  # Lowercase string for enum
                "status": "active",  # Lowercase string for enum
                "created_at": now,
                "updated_at": now
            }
        )
        db.commit()
        
        print(f"✅ Created admin user: {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"\n🎉 You can now log in with these credentials!")
        
        db.close()
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
