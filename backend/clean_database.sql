-- Clean Database Script
-- Run this directly in your PostgreSQL client (pgAdmin, psql, etc.)

-- Step 1: Drop all tables first
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS conversions CASCADE;
DROP TABLE IF EXISTS referral_clicks CASCADE;
DROP TABLE IF EXISTS referral_links CASCADE;
DROP TABLE IF EXISTS program_enrollments CASCADE;
DROP TABLE IF EXISTS affiliate_programs CASCADE;
DROP TABLE IF EXISTS affiliate_profiles CASCADE;
DROP TABLE IF EXISTS affiliate_tiers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Drop alembic version table
DROP TABLE IF EXISTS alembic_version CASCADE;

-- Step 3: Drop all enum types
DROP TYPE IF EXISTS payoutstatus CASCADE;
DROP TYPE IF EXISTS commissionstatus CASCADE;
DROP TYPE IF EXISTS conversionstatus CASCADE;
DROP TYPE IF EXISTS conversiontype CASCADE;
DROP TYPE IF EXISTS referrallinkstatus CASCADE;
DROP TYPE IF EXISTS enrollmentstatus CASCADE;
DROP TYPE IF EXISTS programstatus CASCADE;
DROP TYPE IF EXISTS programtype CASCADE;
DROP TYPE IF EXISTS approvalstatus CASCADE;
DROP TYPE IF EXISTS userstatus CASCADE;
DROP TYPE IF EXISTS userrole CASCADE;

-- Verify all types are gone
SELECT typname FROM pg_type WHERE typname IN (
    'userrole', 'userstatus', 'approvalstatus', 'programtype',
    'programstatus', 'enrollmentstatus', 'referrallinkstatus',
    'conversiontype', 'conversionstatus', 'commissionstatus', 'payoutstatus'
);

-- If the above query returns any rows, manually drop them
