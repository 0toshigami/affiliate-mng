#!/usr/bin/env python3
"""
Complete database reset and seed - drops everything and starts fresh
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def main():
    """Reset database completely"""
    try:
        # Database connection
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/affiliate_mng"
        print(f"Connecting to database...")

        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        print("\n🗑️  Dropping all tables and types...")

        # Drop all tables in the public schema
        db.execute(text("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        """))

        # Drop all enum types
        db.execute(text("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        """))

        # Drop alembic version table
        db.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))

        db.commit()
        print("✅ Database cleared successfully")
        print("\n📝 Next steps:")
        print("   1. Run: docker compose exec backend alembic upgrade head")
        print("   2. Run: docker compose exec backend python seed_admin.py")

        db.close()
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
