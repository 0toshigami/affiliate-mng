-- Complete Database Reset Script
-- Run this before running alembic upgrade head

-- Step 1: Clear alembic version history
DELETE FROM alembic_version;

-- Step 2: Drop all tables in correct order
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

-- Done! Now run: alembic upgrade head
