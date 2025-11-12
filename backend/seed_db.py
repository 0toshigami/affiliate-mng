"""
Database Seeding Script

Run this script to seed the database with initial data:
python seed_db.py
"""
from app.database import SessionLocal
from app.utils.seed import seed_database


def main():
    """Main seeding function"""
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
