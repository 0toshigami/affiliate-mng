"""Add level and benefits columns to affiliate_tiers

Revision ID: 002
Revises: 001
Create Date: 2025-11-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add level column
    op.add_column('affiliate_tiers', sa.Column('level', sa.Integer(), nullable=True))
    
    # Add benefits column
    op.add_column('affiliate_tiers', sa.Column('benefits', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Remove description column (not in model)
    op.drop_column('affiliate_tiers', 'description')
    
    # Set level to NOT NULL after populating (if needed)
    # For now, we'll make it nullable since we might have existing data


def downgrade() -> None:
    # Add back description column
    op.add_column('affiliate_tiers', sa.Column('description', sa.Text(), nullable=True))
    
    # Remove benefits column
    op.drop_column('affiliate_tiers', 'benefits')
    
    # Remove level column
    op.drop_column('affiliate_tiers', 'level')
