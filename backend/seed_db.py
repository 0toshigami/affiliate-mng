#!/usr/bin/env python3
"""
Seed the database with initial data
"""
import sys
from app.database import SessionLocal
from app.utils.seed import seed_database

def main():
    """Main function to seed the database"""
    try:
        print("Starting database seeding...")
        db = SessionLocal()
        seed_database(db)
        db.close()
        print("\n✅ Database seeded successfully!")
        return 0
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
