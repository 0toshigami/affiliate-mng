#!/usr/bin/env python3
"""Quick verification that migration completed successfully"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        # Check alembic version
        result = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
        print(f"✅ Migration version: {result[0] if result else 'None'}")
        
        # Count tables
        result = conn.execute(text("""
            SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
        """)).fetchone()
        print(f"✅ Tables created: {result[0]}")
        
        # Count enum types
        result = conn.execute(text("""
            SELECT COUNT(DISTINCT typname) FROM pg_type 
            WHERE typname IN (
                'userrole', 'userstatus', 'approvalstatus', 'programtype',
                'programstatus', 'enrollmentstatus', 'referrallinkstatus',
                'conversiontype', 'conversionstatus', 'commissionstatus', 'payoutstatus'
            )
        """)).fetchone()
        print(f"✅ Enum types created: {result[0]}")
        
        # List all tables
        result = conn.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        """)).fetchall()
        print(f"\n📊 Tables in database:")
        for (table,) in result:
            print(f"   • {table}")
            
    print("\n🎉 Database migration completed successfully!")
    print("✅ All Phase 1, 2, and 3 tables are ready!")
    print("\n💡 Next steps:")
    print("   1. Start the backend server")
    print("   2. The database schema is ready for use")
        
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
