"""002_content_management_system

Content management system with videos, articles, meal plans, quotes, and user progress tracking.

This migration adds:
- Content categories table
- Videos table for wellness videos
- Articles table for wellness articles
- Meal plans table for nutrition guidance
- Quotes table for inspirational content
- User favorites system
- User progress tracking
- Enhanced document processing capabilities

Revision ID: 002
Revises: 001
Create Date: 2025-09-03 01:35:00.000000

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
    # ### Content Management System Tables Creation ###

    # Create content_categories table
    op.create_table('content_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_content_categories_id'), 'content_categories', ['id'], unique=False)

    # Create videos table
    op.create_table('videos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('youtube_id', sa.String(), nullable=False),
        sa.Column('thumbnail_url', sa.String(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('view_count', sa.Integer(), default=0),
        sa.Column('like_count', sa.Integer(), default=0),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('stress_level', sa.String(), nullable=True),
        sa.Column('mood_boost', sa.Float(), nullable=True),
        sa.Column('relaxation_score', sa.Float(), nullable=True),
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['content_categories.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('youtube_id')
    )
    op.create_index(op.f('ix_videos_id'), 'videos', ['id'], unique=False)

    # Create articles table (without video_url and author_bio - these will be added in migrations 003 and 004)
    op.create_table('articles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('read_time', sa.Integer(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('stress_reduction_tips', sa.JSON(), nullable=True),
        sa.Column('practical_exercises', sa.JSON(), nullable=True),
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['content_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_articles_id'), 'articles', ['id'], unique=False)

    # Create meal_plans table
    op.create_table('meal_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('prep_time', sa.Integer(), nullable=True),
        sa.Column('cook_time', sa.Integer(), nullable=True),
        sa.Column('servings', sa.Integer(), nullable=True),
        sa.Column('calories_per_serving', sa.Integer(), nullable=True),
        sa.Column('protein', sa.Float(), nullable=True),
        sa.Column('carbs', sa.Float(), nullable=True),
        sa.Column('fat', sa.Float(), nullable=True),
        sa.Column('stress_reduction_benefits', sa.JSON(), nullable=True),
        sa.Column('mood_boost_ingredients', sa.JSON(), nullable=True),
        sa.Column('ingredients', sa.JSON(), nullable=True),
        sa.Column('instructions', sa.JSON(), nullable=True),
        sa.Column('tips', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('video_url', sa.String(), nullable=True),
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['content_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_meal_plans_id'), 'meal_plans', ['id'], unique=False)

    # Create quotes table
    op.create_table('quotes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('mood_boost', sa.Float(), nullable=True),
        sa.Column('inspiration_level', sa.Float(), nullable=True),
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['content_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quotes_id'), 'quotes', ['id'], unique=False)

    # Create user_favorites table
    op.create_table('user_favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('video_id', sa.Integer(), nullable=True),
        sa.Column('meal_plan_id', sa.Integer(), nullable=True),
        sa.Column('quote_id', sa.Integer(), nullable=True),
        sa.Column('article_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ),
        sa.ForeignKeyConstraint(['meal_plan_id'], ['meal_plans.id'], ),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_favorites_id'), 'user_favorites', ['id'], unique=False)

    # Create user_progress table
    op.create_table('user_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('mood_rating', sa.Integer(), nullable=True),
        sa.Column('stress_level', sa.Integer(), nullable=True),
        sa.Column('sleep_hours', sa.Float(), nullable=True),
        sa.Column('exercise_minutes', sa.Integer(), nullable=True),
        sa.Column('meditation_minutes', sa.Integer(), nullable=True),
        sa.Column('videos_watched', sa.Integer(), default=0),
        sa.Column('articles_read', sa.Integer(), default=0),
        sa.Column('meal_plans_tried', sa.Integer(), default=0),
        sa.Column('activities_completed', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_progress_id'), 'user_progress', ['id'], unique=False)

    # ### Update existing tables ###
    op.add_column('blacklisted_tokens', sa.Column('blacklisted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('blacklisted_tokens', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False))
    op.add_column('blacklisted_tokens', sa.Column('is_blacklisted', sa.Boolean(), nullable=True))
    op.drop_column('blacklisted_tokens', 'blacklisted_on')
    op.add_column('documents', sa.Column('content', sa.Text(), nullable=True))
    op.add_column('documents', sa.Column('transcription_status', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('transcription_confidence', sa.Float(), nullable=True))
    op.add_column('documents', sa.Column('analysis_status', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('risk_level', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('mental_health_indicators', sa.JSON(), nullable=True))
    op.add_column('documents', sa.Column('summary', sa.Text(), nullable=True))
    op.add_column('documents', sa.Column('recommendations', sa.JSON(), nullable=True))
    op.add_column('documents', sa.Column('title', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('category', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('documents', sa.Column('analyzed_at', sa.DateTime(timezone=True), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### Drop content management tables ###
    op.drop_table('user_progress')
    op.drop_table('user_favorites')
    op.drop_table('quotes')
    op.drop_table('meal_plans')
    op.drop_table('articles')
    op.drop_table('videos')
    op.drop_table('content_categories')
    
    # ### Revert document and token table changes ###
    op.drop_column('documents', 'analyzed_at')
    op.drop_column('documents', 'processed_at')
    op.drop_column('documents', 'category')
    op.drop_column('documents', 'title')
    op.drop_column('documents', 'recommendations')
    op.drop_column('documents', 'summary')
    op.drop_column('documents', 'mental_health_indicators')
    op.drop_column('documents', 'risk_level')
    op.drop_column('documents', 'analysis_status')
    op.drop_column('documents', 'transcription_confidence')
    op.drop_column('documents', 'transcription_status')
    op.drop_column('documents', 'content')
    op.add_column('blacklisted_tokens', sa.Column('blacklisted_on', postgresql.TIMESTAMP(), autoincrement=False, nullable=False))
    op.drop_column('blacklisted_tokens', 'is_blacklisted')
    op.drop_column('blacklisted_tokens', 'expires_at')
    op.drop_column('blacklisted_tokens', 'blacklisted_at')
    # ### end Alembic commands ###
