"""Add missing columns to commissions, conversions, payouts, and affiliate_profiles tables

Revision ID: 003
Revises: 002
Create Date: 2025-11-13 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to commissions table
    op.add_column('commissions', sa.Column('commission_rule', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='{}'))
    op.add_column('commissions', sa.Column('currency', sa.String(3), nullable=False, server_default='USD'))

    # Add missing columns to conversions table
    op.add_column('conversions', sa.Column('currency', sa.String(3), nullable=False, server_default='USD'))

    # Add missing columns to affiliate_profiles table
    op.add_column('affiliate_profiles', sa.Column('payment_method', sa.Enum('BANK_TRANSFER', 'PAYPAL', 'STRIPE', name='paymentmethod'), nullable=True))
    op.add_column('affiliate_profiles', sa.Column('payment_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='{}'))
    op.add_column('affiliate_profiles', sa.Column('tax_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='{}'))

    # Fix payouts table columns
    # Rename date columns to datetime and change names
    op.alter_column('payouts', 'start_date', new_column_name='payout_period_start', type_=sa.DateTime(timezone=True))
    op.alter_column('payouts', 'end_date', new_column_name='payout_period_end', type_=sa.DateTime(timezone=True))

    # Rename commissions_count to commission_count
    op.alter_column('payouts', 'commissions_count', new_column_name='commission_count', type_=sa.Numeric())

    # Add missing columns to payouts table
    op.add_column('payouts', sa.Column('currency', sa.String(3), nullable=False, server_default='USD'))
    op.add_column('payouts', sa.Column('processed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('payouts', sa.Column('notes', sa.String(), nullable=True))

    # Add foreign key for processed_by
    op.create_foreign_key('fk_payout_processor', 'payouts', 'users', ['processed_by'], ['id'], ondelete='SET NULL')

    # Remove metadata column if it exists (not in model)
    op.drop_column('payouts', 'metadata')


def downgrade() -> None:
    # Reverse payouts changes
    op.add_column('payouts', sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.drop_constraint('fk_payout_processor', 'payouts', type_='foreignkey')
    op.drop_column('payouts', 'notes')
    op.drop_column('payouts', 'processed_by')
    op.drop_column('payouts', 'currency')
    op.alter_column('payouts', 'commission_count', new_column_name='commissions_count', type_=sa.Integer())
    op.alter_column('payouts', 'payout_period_end', new_column_name='end_date', type_=sa.Date())
    op.alter_column('payouts', 'payout_period_start', new_column_name='start_date', type_=sa.Date())

    # Reverse affiliate_profiles changes
    op.drop_column('affiliate_profiles', 'tax_info')
    op.drop_column('affiliate_profiles', 'payment_details')
    op.drop_column('affiliate_profiles', 'payment_method')

    # Reverse conversions changes
    op.drop_column('conversions', 'currency')

    # Reverse commissions changes
    op.drop_column('commissions', 'currency')
    op.drop_column('commissions', 'commission_rule')
