from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ContentCategory(Base):
    __tablename__ = "content_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Icon name for UI
    color = Column(String, nullable=True)  # Theme color
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    videos = relationship("Video", back_populates="category")
    meal_plans = relationship("MealPlan", back_populates="category")
    quotes = relationship("Quote", back_populates="category")
    articles = relationship("Article", back_populates="category")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    youtube_id = Column(String, nullable=False, unique=True)
    thumbnail_url = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in seconds
    category_id = Column(Integer, ForeignKey("content_categories.id"), nullable=False)

    # Video metadata
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    tags = Column(JSON, nullable=True)

    # Stress reduction specific
    stress_level = Column(String, nullable=True)  # low, medium, high
    mood_boost = Column(Float, nullable=True)  # 0-10 rating
    relaxation_score = Column(Float, nullable=True)  # 0-10 rating

    # User interaction
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("ContentCategory", back_populates="videos")
    user_favorites = relationship("UserFavorite", back_populates="video")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("content_categories.id"), nullable=False)

    # Meal plan details
    difficulty = Column(String, nullable=True)  # easy, medium, hard
    prep_time = Column(Integer, nullable=True)  # Minutes
    cook_time = Column(Integer, nullable=True)  # Minutes
    servings = Column(Integer, nullable=True)

    # Nutritional info
    calories_per_serving = Column(Integer, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)

    # Stress reduction specific
    stress_reduction_benefits = Column(JSON, nullable=True)
    mood_boost_ingredients = Column(JSON, nullable=True)

    # Content
    ingredients = Column(JSON, nullable=True)  # List of ingredients
    instructions = Column(JSON, nullable=True)  # List of steps
    tips = Column(Text, nullable=True)

    # Media
    image_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)

    # Status
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    category = relationship("ContentCategory", back_populates="meal_plans")


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    author = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("content_categories.id"), nullable=False)

    # Quote metadata
    source = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)

    # Stress reduction specific
    mood_boost = Column(Float, nullable=True)  # 0-10 rating
    inspiration_level = Column(Float, nullable=True)  # 0-10 rating

    # Status
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    category = relationship("ContentCategory", back_populates="quotes")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("content_categories.id"), nullable=False)

    # Article metadata
    author = Column(String, nullable=True)
    author_bio = Column(Text, nullable=True)
    read_time = Column(Integer, nullable=True)  # Minutes
    tags = Column(JSON, nullable=True)

    # Media
    image_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)

    # Stress reduction specific
    stress_reduction_tips = Column(JSON, nullable=True)
    practical_exercises = Column(JSON, nullable=True)

    # Status
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("ContentCategory", back_populates="articles")


class UserFavorite(Base):
    __tablename__ = "user_favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"), nullable=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=True)

    # Favorite metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="favorites")
    video = relationship("Video", back_populates="user_favorites")
    meal_plan = relationship("MealPlan")
    quote = relationship("Quote")
    article = relationship("Article")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Daily wellness tracking
    date = Column(DateTime(timezone=True), server_default=func.now())
    mood_rating = Column(Integer, nullable=True)  # 1-10
    stress_level = Column(Integer, nullable=True)  # 1-10
    sleep_hours = Column(Float, nullable=True)
    exercise_minutes = Column(Integer, nullable=True)
    meditation_minutes = Column(Integer, nullable=True)

    # Content engagement
    videos_watched = Column(Integer, default=0)
    articles_read = Column(Integer, default=0)
    meal_plans_tried = Column(Integer, default=0)

    # Wellness activities
    activities_completed = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="progress")
