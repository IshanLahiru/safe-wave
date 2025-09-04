"""Add performance indexes for frequently queried columns

Revision ID: 005_add_performance_indexes
Revises: 004_add_author_bio_and_updated_at_to_articles
Create Date: 2025-01-04 11:28:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_add_performance_indexes'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    """Add performance indexes for frequently queried columns"""
    
    # Content Categories indexes
    op.create_index('idx_content_categories_is_active', 'content_categories', ['is_active'])
    op.create_index('idx_content_categories_sort_order', 'content_categories', ['sort_order'])
    
    # Videos indexes
    op.create_index('idx_videos_is_active', 'videos', ['is_active'])
    op.create_index('idx_videos_is_featured', 'videos', ['is_featured'])
    op.create_index('idx_videos_category_id', 'videos', ['category_id'])
    op.create_index('idx_videos_stress_level', 'videos', ['stress_level'])
    op.create_index('idx_videos_created_at', 'videos', ['created_at'])
    # Compound indexes for common query patterns
    op.create_index('idx_videos_active_featured', 'videos', ['is_active', 'is_featured'])
    op.create_index('idx_videos_active_category', 'videos', ['is_active', 'category_id'])
    op.create_index('idx_videos_active_stress', 'videos', ['is_active', 'stress_level'])
    
    # Articles indexes
    op.create_index('idx_articles_is_active', 'articles', ['is_active'])
    op.create_index('idx_articles_is_featured', 'articles', ['is_featured'])
    op.create_index('idx_articles_category_id', 'articles', ['category_id'])
    op.create_index('idx_articles_created_at', 'articles', ['created_at'])
    # Compound indexes for common query patterns
    op.create_index('idx_articles_active_featured', 'articles', ['is_active', 'is_featured'])
    op.create_index('idx_articles_active_category', 'articles', ['is_active', 'category_id'])
    
    # Meal Plans indexes
    op.create_index('idx_meal_plans_is_active', 'meal_plans', ['is_active'])
    op.create_index('idx_meal_plans_is_featured', 'meal_plans', ['is_featured'])
    op.create_index('idx_meal_plans_category_id', 'meal_plans', ['category_id'])
    op.create_index('idx_meal_plans_difficulty', 'meal_plans', ['difficulty'])
    op.create_index('idx_meal_plans_created_at', 'meal_plans', ['created_at'])
    # Compound indexes for common query patterns
    op.create_index('idx_meal_plans_active_featured', 'meal_plans', ['is_active', 'is_featured'])
    op.create_index('idx_meal_plans_active_category', 'meal_plans', ['is_active', 'category_id'])
    op.create_index('idx_meal_plans_active_difficulty', 'meal_plans', ['is_active', 'difficulty'])
    
    # Quotes indexes
    op.create_index('idx_quotes_is_active', 'quotes', ['is_active'])
    op.create_index('idx_quotes_is_featured', 'quotes', ['is_featured'])
    op.create_index('idx_quotes_category_id', 'quotes', ['category_id'])
    op.create_index('idx_quotes_created_at', 'quotes', ['created_at'])
    # Compound indexes for common query patterns
    op.create_index('idx_quotes_active_featured', 'quotes', ['is_active', 'is_featured'])
    op.create_index('idx_quotes_active_category', 'quotes', ['is_active', 'category_id'])
    
    # User Progress indexes (critical for daily progress queries)
    op.create_index('idx_user_progress_user_id', 'user_progress', ['user_id'])
    op.create_index('idx_user_progress_date', 'user_progress', ['date'])
    # Compound index for the most common query pattern
    op.create_index('idx_user_progress_user_date', 'user_progress', ['user_id', 'date'])
    
    # User Favorites indexes
    op.create_index('idx_user_favorites_user_id', 'user_favorites', ['user_id'])
    op.create_index('idx_user_favorites_video_id', 'user_favorites', ['video_id'])
    op.create_index('idx_user_favorites_article_id', 'user_favorites', ['article_id'])
    op.create_index('idx_user_favorites_meal_plan_id', 'user_favorites', ['meal_plan_id'])
    op.create_index('idx_user_favorites_quote_id', 'user_favorites', ['quote_id'])
    
    # Audio records indexes (if the table exists)
    # Check if audios table exists first
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if 'audios' in inspector.get_table_names():
        op.create_index('idx_audios_user_id', 'audios', ['user_id'])
        op.create_index('idx_audios_created_at', 'audios', ['created_at'])
        op.create_index('idx_audios_transcription_status', 'audios', ['transcription_status'])
        op.create_index('idx_audios_analysis_status', 'audios', ['analysis_status'])
        # Compound indexes
        op.create_index('idx_audios_user_created', 'audios', ['user_id', 'created_at'])
        op.create_index('idx_audios_user_status', 'audios', ['user_id', 'transcription_status', 'analysis_status'])
    
    # Users table indexes (if additional columns exist)
    if 'users' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('users')]
        if 'is_active' in columns:
            op.create_index('idx_users_is_active', 'users', ['is_active'])
        if 'email' in columns:
            op.create_index('idx_users_email', 'users', ['email'])
        if 'created_at' in columns:
            op.create_index('idx_users_created_at', 'users', ['created_at'])


def downgrade():
    """Remove performance indexes"""
    
    # Content Categories indexes
    op.drop_index('idx_content_categories_is_active')
    op.drop_index('idx_content_categories_sort_order')
    
    # Videos indexes
    op.drop_index('idx_videos_is_active')
    op.drop_index('idx_videos_is_featured')
    op.drop_index('idx_videos_category_id')
    op.drop_index('idx_videos_stress_level')
    op.drop_index('idx_videos_created_at')
    op.drop_index('idx_videos_active_featured')
    op.drop_index('idx_videos_active_category')
    op.drop_index('idx_videos_active_stress')
    
    # Articles indexes
    op.drop_index('idx_articles_is_active')
    op.drop_index('idx_articles_is_featured')
    op.drop_index('idx_articles_category_id')
    op.drop_index('idx_articles_created_at')
    op.drop_index('idx_articles_active_featured')
    op.drop_index('idx_articles_active_category')
    
    # Meal Plans indexes
    op.drop_index('idx_meal_plans_is_active')
    op.drop_index('idx_meal_plans_is_featured')
    op.drop_index('idx_meal_plans_category_id')
    op.drop_index('idx_meal_plans_difficulty')
    op.drop_index('idx_meal_plans_created_at')
    op.drop_index('idx_meal_plans_active_featured')
    op.drop_index('idx_meal_plans_active_category')
    op.drop_index('idx_meal_plans_active_difficulty')
    
    # Quotes indexes
    op.drop_index('idx_quotes_is_active')
    op.drop_index('idx_quotes_is_featured')
    op.drop_index('idx_quotes_category_id')
    op.drop_index('idx_quotes_created_at')
    op.drop_index('idx_quotes_active_featured')
    op.drop_index('idx_quotes_active_category')
    
    # User Progress indexes
    op.drop_index('idx_user_progress_user_id')
    op.drop_index('idx_user_progress_date')
    op.drop_index('idx_user_progress_user_date')
    
    # User Favorites indexes
    op.drop_index('idx_user_favorites_user_id')
    op.drop_index('idx_user_favorites_video_id')
    op.drop_index('idx_user_favorites_article_id')
    op.drop_index('idx_user_favorites_meal_plan_id')
    op.drop_index('idx_user_favorites_quote_id')
    
    # Audio records indexes (if they exist)
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if 'audios' in inspector.get_table_names():
        try:
            op.drop_index('idx_audios_user_id')
            op.drop_index('idx_audios_created_at')
            op.drop_index('idx_audios_transcription_status')
            op.drop_index('idx_audios_analysis_status')
            op.drop_index('idx_audios_user_created')
            op.drop_index('idx_audios_user_status')
        except:
            pass  # Indexes may not exist
    
    # Users table indexes
    if 'users' in inspector.get_table_names():
        try:
            op.drop_index('idx_users_is_active')
            op.drop_index('idx_users_email')
            op.drop_index('idx_users_created_at')
        except:
            pass  # Indexes may not exist