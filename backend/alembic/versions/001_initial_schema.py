"""Initial schema with all Phase 1, 2, and 3 tables

Revision ID: 001
Revises:
Create Date: 2025-11-12 05:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    # NOTE: Database should be clean before running this migration
    # Use force_reset_db.py to clean the database first
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'affiliate', 'customer')")
    op.execute("CREATE TYPE userstatus AS ENUM ('active', 'inactive', 'suspended')")
    op.execute("CREATE TYPE approvalstatus AS ENUM ('pending', 'approved', 'rejected')")
    op.execute("CREATE TYPE programtype AS ENUM ('saas', 'lead_gen', 'content_media')")
    op.execute("CREATE TYPE programstatus AS ENUM ('active', 'paused', 'archived')")
    op.execute("CREATE TYPE enrollmentstatus AS ENUM ('pending', 'active', 'paused', 'terminated')")
    op.execute("CREATE TYPE referrallinkstatus AS ENUM ('active', 'inactive')")
    op.execute("CREATE TYPE conversiontype AS ENUM ('signup', 'trial_start', 'subscription', 'purchase', 'lead')")
    op.execute("CREATE TYPE conversionstatus AS ENUM ('pending', 'validated', 'rejected')")
    op.execute("CREATE TYPE commissionstatus AS ENUM ('pending', 'approved', 'rejected', 'paid')")
    op.execute("CREATE TYPE payoutstatus AS ENUM ('pending', 'processing', 'paid', 'cancelled')")

    # Phase 1: Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.Enum('admin', 'affiliate', 'customer', name='userrole'), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'suspended', name='userstatus'), nullable=False, server_default='active'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Phase 1: Affiliate tiers table
    op.create_table(
        'affiliate_tiers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('commission_multiplier', sa.Numeric(5, 2), nullable=False, server_default='1.0'),
        sa.Column('requirements', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Phase 1: Affiliate profiles table
    op.create_table(
        'affiliate_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('affiliate_code', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('tier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('website_url', sa.String(500), nullable=True),
        sa.Column('social_media', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('approval_status', sa.Enum('pending', 'approved', 'rejected', name='approvalstatus'), nullable=False, server_default='pending'),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tier_id'], ['affiliate_tiers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
    )

    # Phase 1: Affiliate programs table
    op.create_table(
        'affiliate_programs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('program_type', sa.Enum('saas', 'lead_gen', 'content_media', name='programtype'), nullable=False),
        sa.Column('status', sa.Enum('active', 'paused', 'archived', name='programstatus'), nullable=False, server_default='active'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('terms_and_conditions', sa.Text(), nullable=True),
        sa.Column('commission_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )

    # Phase 2: Program enrollments table
    op.create_table(
        'program_enrollments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('affiliate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('program_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('pending', 'active', 'paused', 'terminated', name='enrollmentstatus'), nullable=False, server_default='active'),
        sa.Column('custom_commission_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('enrolled_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('terminated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['affiliate_id'], ['affiliate_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['program_id'], ['affiliate_programs.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_enrollment_affiliate_program', 'program_enrollments', ['affiliate_id', 'program_id'], unique=True)

    # Phase 2: Referral links table
    op.create_table(
        'referral_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('affiliate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('program_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('link_code', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('target_url', sa.String(1000), nullable=False),
        sa.Column('utm_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('link_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('clicks_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('conversions_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('active', 'inactive', name='referrallinkstatus'), nullable=False, server_default='active'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['enrollment_id'], ['program_enrollments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['affiliate_id'], ['affiliate_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['program_id'], ['affiliate_programs.id'], ondelete='CASCADE'),
    )

    # Phase 2: Referral clicks table
    op.create_table(
        'referral_clicks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('referral_link_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('visitor_session_id', sa.String(255), nullable=False, index=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('referer', sa.String(1000), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('clicked_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['referral_link_id'], ['referral_links.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_click_link_session', 'referral_clicks', ['referral_link_id', 'visitor_session_id'])

    # Phase 3: Conversions table
    op.create_table(
        'conversions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('referral_link_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('affiliate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('program_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversion_type', sa.Enum('signup', 'trial_start', 'subscription', 'purchase', 'lead', name='conversiontype'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'validated', 'rejected', name='conversionstatus'), nullable=False, server_default='pending'),
        sa.Column('conversion_value', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('visitor_session_id', sa.String(255), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('conversion_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('validated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['referral_link_id'], ['referral_links.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['affiliate_id'], ['affiliate_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['program_id'], ['affiliate_programs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_conversion_affiliate', 'conversions', ['affiliate_id'])
    op.create_index('idx_conversion_program', 'conversions', ['program_id'])
    op.create_index('idx_conversion_status', 'conversions', ['status'])

    # Phase 3: Commissions table
    op.create_table(
        'commissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('conversion_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('affiliate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('program_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('base_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('tier_multiplier', sa.Numeric(5, 2), nullable=False, server_default='1.0'),
        sa.Column('final_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', 'paid', name='commissionstatus'), nullable=False, server_default='pending'),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('payout_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['conversion_id'], ['conversions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['affiliate_id'], ['affiliate_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['program_id'], ['affiliate_programs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tier_id'], ['affiliate_tiers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_commission_affiliate', 'commissions', ['affiliate_id'])
    op.create_index('idx_commission_status', 'commissions', ['status'])
    op.create_index('idx_commission_payout', 'commissions', ['payout_id'])

    # Phase 3: Payouts table
    op.create_table(
        'payouts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('affiliate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('commissions_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'processing', 'paid', 'cancelled', name='payoutstatus'), nullable=False, server_default='pending'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(100), nullable=True),
        sa.Column('payment_reference', sa.String(255), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['affiliate_id'], ['affiliate_profiles.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_payout_affiliate', 'payouts', ['affiliate_id'])
    op.create_index('idx_payout_status', 'payouts', ['status'])

    # Add foreign key from commissions to payouts
    op.create_foreign_key('fk_commission_payout', 'commissions', 'payouts', ['payout_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('payouts')
    op.drop_table('commissions')
    op.drop_table('conversions')
    op.drop_table('referral_clicks')
    op.drop_table('referral_links')
    op.drop_table('program_enrollments')
    op.drop_table('affiliate_programs')
    op.drop_table('affiliate_profiles')
    op.drop_table('affiliate_tiers')
    op.drop_table('users')

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS payoutstatus")
    op.execute("DROP TYPE IF EXISTS commissionstatus")
    op.execute("DROP TYPE IF EXISTS conversionstatus")
    op.execute("DROP TYPE IF EXISTS conversiontype")
    op.execute("DROP TYPE IF EXISTS referrallinkstatus")
    op.execute("DROP TYPE IF EXISTS enrollmentstatus")
    op.execute("DROP TYPE IF EXISTS programstatus")
    op.execute("DROP TYPE IF EXISTS programtype")
    op.execute("DROP TYPE IF EXISTS approvalstatus")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
