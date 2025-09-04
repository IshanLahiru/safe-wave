"""004_add_author_bio_and_updated_at_to_articles

Add author_bio and updated_at fields to articles table for enhanced content management.

This migration adds:
- author_bio column to articles table (nullable Text)
- updated_at column to articles table (DateTime with timezone, auto-updated)
- Provides detailed author information for articles
- Enables tracking of article modification timestamps
- Maintains backward compatibility with existing articles

Revision ID: 004
Revises: 003
Create Date: 2025-09-04 03:56:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add author_bio and updated_at columns to articles table"""
    # Add author_bio column to articles table
    op.add_column('articles', sa.Column('author_bio', sa.Text(), nullable=True))
    
    # Add updated_at column to articles table
    op.add_column('articles', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove author_bio and updated_at columns from articles table"""
    # Remove updated_at column from articles table
    op.drop_column('articles', 'updated_at')
    
    # Remove author_bio column from articles table
    op.drop_column('articles', 'author_bio')
