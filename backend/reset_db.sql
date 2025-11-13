-- Reset Database Script
-- Run this to clean up existing database objects before running migrations

-- Drop all tables in reverse order of dependencies
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

-- Drop all enum types
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

-- Clear alembic version table
DELETE FROM alembic_version;
