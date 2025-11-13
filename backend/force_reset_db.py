#!/usr/bin/env python3
"""
Force Database Reset Script
This script forcefully drops all database objects using raw psycopg2 with autocommit.

Usage:
    python force_reset_db.py
"""
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_connection_params():
    """Get connection parameters from environment or use defaults"""
    try:
        from app.core.config import settings
        # Parse DATABASE_URL
        url = settings.DATABASE_URL
        # Remove postgresql:// prefix
        url = url.replace('postgresql://', '')
        # Split user:pass@host:port/db
        if '@' in url:
            auth, rest = url.split('@')
            user, password = auth.split(':')
            host_port, db = rest.split('/')
            host, port = host_port.split(':')
        else:
            raise ValueError("Invalid DATABASE_URL format")

        return {
            'host': host,
            'port': int(port),
            'user': user,
            'password': password,
            'dbname': db
        }
    except Exception as e:
        print(f"⚠️  Could not load from settings: {e}")
        print("Using default values from .env.example")
        return {
            'host': 'localhost',
            'port': 5432,
            'user': 'postgres',
            'password': 'postgres',
            'dbname': 'affiliate_mng'
        }

def force_reset_database():
    """Force reset the database by dropping all objects"""
    try:
        conn_params = get_connection_params()
        print(f"🔄 Connecting to database: {conn_params['dbname']} at {conn_params['host']}:{conn_params['port']}")

        # Connect with autocommit mode
        conn = psycopg2.connect(**conn_params)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        print("\n📋 Step 1: Dropping all tables...")
        tables = [
            "payouts",
            "commissions",
            "conversions",
            "referral_clicks",
            "referral_links",
            "program_enrollments",
            "affiliate_programs",
            "affiliate_profiles",
            "affiliate_tiers",
            "users",
            "alembic_version"
        ]

        for table in tables:
            try:
                cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
                print(f"   ✓ Dropped table: {table}")
            except Exception as e:
                print(f"   ⚠️  Could not drop {table}: {e}")

        print("\n📋 Step 2: Dropping all enum types...")
        types = [
            "payoutstatus",
            "commissionstatus",
            "conversionstatus",
            "conversiontype",
            "referrallinkstatus",
            "enrollmentstatus",
            "programstatus",
            "programtype",
            "approvalstatus",
            "userstatus",
            "userrole"
        ]

        for type_name in types:
            try:
                cur.execute(f"DROP TYPE IF EXISTS {type_name} CASCADE")
                print(f"   ✓ Dropped type: {type_name}")
            except Exception as e:
                print(f"   ⚠️  Could not drop {type_name}: {e}")

        print("\n📋 Step 3: Verifying cleanup...")
        # Check for remaining types
        cur.execute("""
            SELECT typname FROM pg_type
            WHERE typname IN (
                'userrole', 'userstatus', 'approvalstatus', 'programtype',
                'programstatus', 'enrollmentstatus', 'referrallinkstatus',
                'conversiontype', 'conversionstatus', 'commissionstatus', 'payoutstatus'
            )
        """)
        remaining_types = cur.fetchall()

        if remaining_types:
            print("   ⚠️  Warning: Some types still exist:")
            for (typename,) in remaining_types:
                print(f"      - {typename}")
                # Try to force drop again
                try:
                    cur.execute(f"DROP TYPE {typename} CASCADE")
                    print(f"        ✓ Force dropped {typename}")
                except Exception as e:
                    print(f"        ✗ Could not force drop: {e}")
        else:
            print("   ✓ All enum types cleaned successfully!")

        # Check for remaining tables
        cur.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename NOT LIKE 'pg_%'
        """)
        remaining_tables = cur.fetchall()

        if remaining_tables:
            print("\n   ℹ️  Remaining tables in public schema:")
            for (tablename,) in remaining_tables:
                print(f"      - {tablename}")
        else:
            print("   ✓ All tables cleaned successfully!")

        cur.close()
        conn.close()

        print("\n✅ Database reset complete!")
        print("📝 Now run: alembic upgrade head")
        return 0

    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(force_reset_database())
