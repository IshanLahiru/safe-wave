"""003_add_video_url_to_articles

Add video_url field to articles table for multimedia content support.

This migration adds:
- video_url column to articles table (nullable String)
- Allows articles to include optional video content alongside text
- Supports YouTube URLs and other video platforms
- Maintains backward compatibility with existing articles

Revision ID: 003
Revises: 002
Create Date: 2025-09-04 03:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add video_url column to articles table"""
    # Add video_url column to articles table
    op.add_column('articles', sa.Column('video_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove video_url column from articles table"""
    # Remove video_url column from articles table
    op.drop_column('articles', 'video_url')
