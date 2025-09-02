"""add_audio_duration_field

Revision ID: 528efae650e6
Revises: 003
Create Date: 2025-09-01 18:04:54.168404

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '528efae650e6'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add duration column if it doesn't exist
    # Note: The duration column already exists in the Audio model, 
    # but we need to populate it for existing records
    
    # Get connection
    connection = op.get_bind()
    
    # Check if duration column exists
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('audios')]
    
    if 'duration' not in columns:
        # Add duration column
        op.add_column('audios', sa.Column('duration', sa.Float(), nullable=True))
        print("Added duration column to audios table")
    
    # Update existing audio records to calculate duration
    # This will be done by the application when audio files are processed
    print("Duration field added. Existing audio files will get duration calculated during next processing.")


def downgrade() -> None:
    # Remove duration column
    op.drop_column('audios', 'duration')
