#!/usr/bin/env python3
"""
Database State Checker
Shows what tables and types currently exist in the database.

Usage:
    python check_db_state.py
"""
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_connection_params():
    """Get connection parameters"""
    try:
        from app.core.config import settings
        url = settings.DATABASE_URL
        url = url.replace('postgresql://', '')
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
        print(f"⚠️  Using defaults: {e}")
        return {
            'host': 'localhost',
            'port': 5432,
            'user': 'postgres',
            'password': 'postgres',
            'dbname': 'affiliate_mng'
        }

def check_database_state():
    """Check current database state"""
    try:
        conn_params = get_connection_params()
        print(f"🔍 Checking database: {conn_params['dbname']} at {conn_params['host']}:{conn_params['port']}\n")

        conn = psycopg2.connect(**conn_params)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check for tables
        print("📊 Tables in public schema:")
        cur.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        tables = cur.fetchall()
        if tables:
            for (tablename,) in tables:
                print(f"   • {tablename}")
        else:
            print("   (none)")

        # Check for enum types
        print("\n📊 Custom enum types:")
        cur.execute("""
            SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname IN (
                'userrole', 'userstatus', 'approvalstatus', 'programtype',
                'programstatus', 'enrollmentstatus', 'referrallinkstatus',
                'conversiontype', 'conversionstatus', 'commissionstatus', 'payoutstatus'
            )
            GROUP BY t.typname
            ORDER BY t.typname
        """)
        types = cur.fetchall()
        if types:
            for (typename, values) in types:
                print(f"   • {typename}: {values}")
        else:
            print("   (none)")

        # Check alembic version
        print("\n📊 Alembic migration state:")
        try:
            cur.execute("SELECT version_num FROM alembic_version")
            version = cur.fetchone()
            if version:
                print(f"   Current version: {version[0]}")
            else:
                print("   No version recorded (no migrations run)")
        except:
            print("   alembic_version table doesn't exist")

        # Check for any objects that might be depending on our types
        print("\n📊 Dependencies on custom types:")
        cur.execute("""
            SELECT DISTINCT
                n.nspname as schema,
                c.relname as table,
                a.attname as column,
                t.typname as type
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_attribute a ON a.attrelid = c.oid
            JOIN pg_type t ON t.oid = a.atttypid
            WHERE t.typname IN (
                'userrole', 'userstatus', 'approvalstatus', 'programtype',
                'programstatus', 'enrollmentstatus', 'referrallinkstatus',
                'conversiontype', 'conversionstatus', 'commissionstatus', 'payoutstatus'
            )
            AND c.relkind = 'r'
            AND n.nspname = 'public'
            ORDER BY c.relname, a.attname
        """)
        deps = cur.fetchall()
        if deps:
            print("   Types are being used by:")
            for (schema, table, column, typename) in deps:
                print(f"      {table}.{column} → {typename}")
        else:
            print("   (no dependencies)")

        cur.close()
        conn.close()

        print("\n" + "="*60)
        print("💡 Next steps:")
        if types:
            print("   1. Run: python force_reset_db.py")
            print("   2. Then: alembic upgrade head")
        else:
            print("   Database is clean! Run: alembic upgrade head")

        return 0

    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(check_database_state())
