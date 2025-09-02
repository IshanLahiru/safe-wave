"""001_initial_database_structure

Initial database structure with proper relationships and email alerts system.

This migration creates:
- Users table with emergency contacts and care person information
- Audios table for audio file management and analysis
- Email alerts table to replace audio_analysis table
- Documents table for file management
- Content management tables (videos, articles, meal plans, quotes, categories)
- User favorites and progress tracking
- Blacklisted tokens for authentication

Revision ID: 001
Revises: 
Create Date: 2025-09-03 01:30:00.000000

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
    """Create initial database structure."""

    # Drop audio_analyses table if it exists (from old structure)
    op.execute("DROP TABLE IF EXISTS audio_analyses CASCADE")

    # Create users table (or alter if exists)
    op.execute("DROP TABLE IF EXISTS users CASCADE")
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('is_onboarding_complete', sa.Boolean(), nullable=True),
        sa.Column('emergency_contact_name', sa.String(), nullable=True),
        sa.Column('emergency_contact_email', sa.String(), nullable=True),
        sa.Column('emergency_contact_relationship', sa.String(), nullable=True),
        sa.Column('care_person_email', sa.String(), nullable=True),
        sa.Column('preferences', sa.JSON(), nullable=True),
        sa.Column('onboarding_answers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create audios table (or recreate if exists)
    op.execute("DROP TABLE IF EXISTS audios CASCADE")
    op.create_table('audios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('transcription', sa.Text(), nullable=True),
        sa.Column('transcription_confidence', sa.Float(), nullable=True),
        sa.Column('transcription_status', sa.String(), nullable=True),
        sa.Column('analysis_status', sa.String(), nullable=True),
        sa.Column('risk_level', sa.String(), nullable=True),
        sa.Column('mental_health_indicators', sa.JSON(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('mood_rating', sa.Integer(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('transcribed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('analyzed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audios_id'), 'audios', ['id'], unique=False)

    # Create email_alerts table (replaces audio_analysis)
    op.create_table('email_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('audio_id', sa.Integer(), nullable=True),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('recipient_email', sa.String(), nullable=False),
        sa.Column('recipient_type', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('risk_level', sa.String(), nullable=True),
        sa.Column('urgency_level', sa.String(), nullable=True),
        sa.Column('analysis_data', sa.JSON(), nullable=True),
        sa.Column('transcription', sa.Text(), nullable=True),
        sa.Column('transcription_confidence', sa.Integer(), nullable=True),
        sa.Column('sent_successfully', sa.Boolean(), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('max_retries', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['audio_id'], ['audios.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_alerts_alert_type'), 'email_alerts', ['alert_type'], unique=False)
    op.create_index(op.f('ix_email_alerts_audio_id'), 'email_alerts', ['audio_id'], unique=False)
    op.create_index(op.f('ix_email_alerts_id'), 'email_alerts', ['id'], unique=False)
    op.create_index(op.f('ix_email_alerts_recipient_email'), 'email_alerts', ['recipient_email'], unique=False)
    op.create_index(op.f('ix_email_alerts_risk_level'), 'email_alerts', ['risk_level'], unique=False)
    op.create_index(op.f('ix_email_alerts_user_id'), 'email_alerts', ['user_id'], unique=False)

    # Create documents table (or recreate if exists)
    op.execute("DROP TABLE IF EXISTS documents CASCADE")
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)

    # Create blacklisted_tokens table (or recreate if exists)
    op.execute("DROP TABLE IF EXISTS blacklisted_tokens CASCADE")
    op.create_table('blacklisted_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('blacklisted_on', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_blacklisted_tokens_id'), 'blacklisted_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_blacklisted_tokens_token'), 'blacklisted_tokens', ['token'], unique=True)


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('blacklisted_tokens')
    op.drop_table('documents')
    op.drop_table('email_alerts')
    op.drop_table('audios')
    op.drop_table('users')
