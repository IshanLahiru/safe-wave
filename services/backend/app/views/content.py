import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.content import (
    Article,
    ContentCategory,
    MealPlan,
    Quote,
    UserFavorite,
    UserProgress,
    Video,
)
from app.models.user import User
from app.views.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/categories")
async def get_content_categories(db: Session = Depends(get_db)):
    """Get all content categories"""
    try:
        categories = (
            db.query(ContentCategory)
            .filter(ContentCategory.is_active == True)
            .order_by(ContentCategory.sort_order)
            .all()
        )

        return {
            "categories": [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "description": cat.description,
                    "icon": cat.icon,
                    "color": cat.color,
                }
                for cat in categories
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")


@router.get("/home-content")
async def get_home_content(
    featured_limit: int = Query(5, le=10, description="Limit for featured articles"),
    db: Session = Depends(get_db)
):
    """Get public home content without authentication - OPTIMIZED VERSION"""
    try:
        # Get featured videos (limit 3) - using optimized query with indexes
        videos = (
            db.query(Video)
            .filter(and_(Video.is_active == True, Video.is_featured == True))
            .order_by(Video.created_at.desc())
            .limit(3)
            .all()
        )

        # Get featured meal plans (limit 2) - using optimized query with indexes
        meal_plans = (
            db.query(MealPlan)
            .filter(and_(MealPlan.is_active == True, MealPlan.is_featured == True))
            .order_by(MealPlan.created_at.desc())
            .limit(2)
            .all()
        )

        # Get a random quote - optimized with limit first then random
        quote = (
            db.query(Quote)
            .filter(Quote.is_active == True)
            .order_by(func.random())
            .limit(1)
            .first()
        )

        # CRITICAL FIX: Get ONLY featured articles with limit (was loading ALL articles!)
        articles = (
            db.query(Article)
            .filter(and_(Article.is_active == True, Article.is_featured == True))
            .order_by(Article.created_at.desc())
            .limit(featured_limit)
            .all()
        )

        # Get today's progress for demo user - optimized query with compound index
        demo_user_id = 1
        today = datetime.now().date()
        today_progress = (
            db.query(UserProgress)
            .filter(
                and_(
                    UserProgress.user_id == demo_user_id,
                    func.date(UserProgress.date) == today
                )
            )
            .first()
        )

        return {
            "featured_videos": [
                {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "youtube_id": video.youtube_id,
                    "thumbnail_url": video.thumbnail_url,
                    "duration": video.duration,
                    "category": {
                        "id": video.category.id,
                        "name": video.category.name,
                        "color": video.category.color,
                    },
                    "stress_level": video.stress_level,
                    "mood_boost": video.mood_boost,
                }
                for video in videos
            ],
            "featured_meal_plans": [
                {
                    "id": meal.id,
                    "title": meal.title,
                    "description": meal.description,
                    "difficulty": meal.difficulty,
                    "prep_time": meal.prep_time,
                    "cook_time": meal.cook_time,
                    "servings": meal.servings,
                    "calories_per_serving": meal.calories_per_serving,
                    "protein": meal.protein,
                    "carbs": meal.carbs,
                    "fat": meal.fat,
                    "stress_reduction_benefits": meal.stress_reduction_benefits,
                    "mood_boost_ingredients": meal.mood_boost_ingredients,
                    "ingredients": meal.ingredients,
                    "instructions": meal.instructions,
                    "tips": meal.tips,
                    "image_url": meal.image_url,
                    "video_url": meal.video_url,
                    "category": {
                        "id": meal.category.id,
                        "name": meal.category.name,
                        "color": meal.category.color,
                    },
                }
                for meal in meal_plans
            ],
            "daily_quote": (
                {
                    "id": quote.id,
                    "text": quote.text,
                    "author": quote.author,
                    "category": {
                        "id": quote.category.id,
                        "name": quote.category.name,
                        "color": quote.category.color,
                    },
                }
                if quote
                else None
            ),
            "featured_articles": [
                {
                    "id": article.id,
                    "title": article.title,
                    "excerpt": article.excerpt,
                    "content": article.content,
                    "read_time": article.read_time,
                    "image_url": article.image_url,
                    "video_url": article.video_url,
                    "category": {
                        "id": article.category.id,
                        "name": article.category.name,
                        "color": article.category.color,
                    },
                    "stress_reduction_tips": article.stress_reduction_tips,
                    "practical_exercises": article.practical_exercises,
                    "author": article.author,
                    "author_bio": article.author_bio,
                    "tags": article.tags,
                    "is_featured": article.is_featured,
                    "created_at": article.created_at.isoformat(),
                    "updated_at": article.updated_at.isoformat() if article.updated_at else None,
                }
                for article in articles
            ],
            "user_progress": (
                {
                    "mood_rating": today_progress.mood_rating if today_progress else None,
                    "stress_level": today_progress.stress_level if today_progress else None,
                    "sleep_hours": today_progress.sleep_hours if today_progress else None,
                    "exercise_minutes": today_progress.exercise_minutes if today_progress else None,
                    "meditation_minutes": (
                        today_progress.meditation_minutes if today_progress else None
                    ),
                    "notes": today_progress.notes if today_progress else None,
                    "date": (
                        today_progress.date.isoformat()
                        if today_progress and today_progress.date
                        else None
                    ),
                }
                if today_progress
                else None
            ),
        }
    except Exception as e:
        logger.error(f"Error fetching home content: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch home content")


@router.get("/videos")
async def get_videos(
    category_id: Optional[int] = Query(None),
    stress_level: Optional[str] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get stress-reduction videos"""
    try:
        query = db.query(Video).filter(Video.is_active == True)

        if category_id:
            query = query.filter(Video.category_id == category_id)

        if stress_level:
            query = query.filter(Video.stress_level == stress_level)

        if featured:
            query = query.filter(Video.is_featured == True)

        videos = query.order_by(Video.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "videos": [
                {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "youtube_id": video.youtube_id,
                    "thumbnail_url": video.thumbnail_url,
                    "duration": video.duration,
                    "category": {
                        "id": video.category.id,
                        "name": video.category.name,
                        "color": video.category.color,
                    },
                    "stress_level": video.stress_level,
                    "mood_boost": video.mood_boost,
                    "relaxation_score": video.relaxation_score,
                    "view_count": video.view_count,
                    "like_count": video.like_count,
                    "tags": video.tags,
                    "is_featured": video.is_featured,
                    "created_at": video.created_at.isoformat(),
                }
                for video in videos
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")


@router.get("/meal-plans")
async def get_meal_plans(
    category_id: Optional[int] = Query(None),
    difficulty: Optional[str] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get stress-reduction meal plans"""
    try:
        query = db.query(MealPlan).filter(MealPlan.is_active == True)

        if category_id:
            query = query.filter(MealPlan.category_id == category_id)

        if difficulty:
            query = query.filter(MealPlan.difficulty == difficulty)

        if featured:
            query = query.filter(MealPlan.is_featured == True)

        meal_plans = query.order_by(MealPlan.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "meal_plans": [
                {
                    "id": meal.id,
                    "title": meal.title,
                    "description": meal.description,
                    "category": {
                        "id": meal.category.id,
                        "name": meal.category.name,
                        "color": meal.category.color,
                    },
                    "difficulty": meal.difficulty,
                    "prep_time": meal.prep_time,
                    "cook_time": meal.cook_time,
                    "servings": meal.servings,
                    "calories_per_serving": meal.calories_per_serving,
                    "protein": meal.protein,
                    "carbs": meal.carbs,
                    "fat": meal.fat,
                    "stress_reduction_benefits": meal.stress_reduction_benefits,
                    "mood_boost_ingredients": meal.mood_boost_ingredients,
                    "ingredients": meal.ingredients,
                    "instructions": meal.instructions,
                    "tips": meal.tips,
                    "image_url": meal.image_url,
                    "video_url": meal.video_url,
                    "is_featured": meal.is_featured,
                    "created_at": meal.created_at.isoformat(),
                }
                for meal in meal_plans
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching meal plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch meal plans")


@router.get("/quotes")
async def get_quotes(
    category_id: Optional[int] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(10, le=50),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get inspirational quotes"""
    try:
        query = db.query(Quote).filter(Quote.is_active == True)

        if category_id:
            query = query.filter(Quote.category_id == category_id)

        if featured:
            query = query.filter(Quote.is_featured == True)

        quotes = query.order_by(func.random()).offset(offset).limit(limit).all()

        return {
            "quotes": [
                {
                    "id": quote.id,
                    "text": quote.text,
                    "author": quote.author,
                    "category": {
                        "id": quote.category.id,
                        "name": quote.category.name,
                        "color": quote.category.color,
                    },
                    "source": quote.source,
                    "tags": quote.tags,
                    "mood_boost": quote.mood_boost,
                    "inspiration_level": quote.inspiration_level,
                    "is_featured": quote.is_featured,
                    "created_at": quote.created_at.isoformat(),
                }
                for quote in quotes
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching quotes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quotes")


@router.get("/articles")
async def get_articles(
    category_id: Optional[int] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get wellness articles"""
    try:
        query = db.query(Article).filter(Article.is_active == True)

        if category_id:
            query = query.filter(Article.category_id == category_id)

        if featured:
            query = query.filter(Article.is_featured == True)

        articles = query.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "articles": [
                {
                    "id": article.id,
                    "title": article.title,
                    "content": article.content,
                    "excerpt": article.excerpt,
                    "category": {
                        "id": article.category.id,
                        "name": article.category.name,
                        "color": article.category.color,
                    },
                    "author": article.author,
                    "read_time": article.read_time,
                    "tags": article.tags,
                    "image_url": article.image_url,
                    "stress_reduction_tips": article.stress_reduction_tips,
                    "practical_exercises": article.practical_exercises,
                    "is_featured": article.is_featured,
                    "created_at": article.created_at.isoformat(),
                }
                for article in articles
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles")


@router.get("/home-content")
async def get_home_content(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get personalized home content"""
    try:
        # Get featured content
        featured_videos = (
            db.query(Video)
            .filter(and_(Video.is_active == True, Video.is_featured == True))
            .limit(3)
            .all()
        )

        featured_meal_plans = (
            db.query(MealPlan)
            .filter(and_(MealPlan.is_active == True, MealPlan.is_featured == True))
            .limit(2)
            .all()
        )

        daily_quote = (
            db.query(Quote).filter(Quote.is_active == True).order_by(func.random()).first()
        )

        featured_articles = (
            db.query(Article)
            .filter(and_(Article.is_active == True, Article.is_featured == True))
            .limit(2)
            .all()
        )

        # Get user's recent progress
        today = datetime.now().date()
        user_progress = (
            db.query(UserProgress)
            .filter(
                and_(UserProgress.user_id == current_user.id, func.date(UserProgress.date) == today)
            )
            .first()
        )

        return {
            "featured_videos": [
                {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "youtube_id": video.youtube_id,
                    "thumbnail_url": video.thumbnail_url,
                    "duration": video.duration,
                    "category": {
                        "id": video.category.id,
                        "name": video.category.name,
                        "color": video.category.color,
                    },
                    "stress_level": video.stress_level,
                    "mood_boost": video.mood_boost,
                }
                for video in featured_videos
            ],
            "featured_meal_plans": [
                {
                    "id": meal.id,
                    "title": meal.title,
                    "description": meal.description,
                    "difficulty": meal.difficulty,
                    "prep_time": meal.prep_time,
                    "image_url": meal.image_url,
                    "category": {
                        "id": meal.category.id,
                        "name": meal.category.name,
                        "color": meal.category.color,
                    },
                }
                for meal in featured_meal_plans
            ],
            "daily_quote": (
                {
                    "id": daily_quote.id,
                    "text": daily_quote.text,
                    "author": daily_quote.author,
                    "category": {
                        "id": daily_quote.category.id,
                        "name": daily_quote.category.name,
                        "color": daily_quote.category.color,
                    },
                }
                if daily_quote
                else None
            ),
            "featured_articles": [
                {
                    "id": article.id,
                    "title": article.title,
                    "excerpt": article.excerpt,
                    "read_time": article.read_time,
                    "image_url": article.image_url,
                    "category": {
                        "id": article.category.id,
                        "name": article.category.name,
                        "color": article.category.color,
                    },
                }
                for article in featured_articles
            ],
            "user_progress": (
                {
                    "mood_rating": user_progress.mood_rating if user_progress else None,
                    "stress_level": user_progress.stress_level if user_progress else None,
                    "sleep_hours": user_progress.sleep_hours if user_progress else None,
                    "exercise_minutes": user_progress.exercise_minutes if user_progress else None,
                    "meditation_minutes": (
                        user_progress.meditation_minutes if user_progress else None
                    ),
                }
                if user_progress
                else None
            ),
        }
    except Exception as e:
        logger.error(f"Error fetching home content: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch home content")


@router.post("/favorites/{content_type}/{content_id}")
async def toggle_favorite(
    content_type: str,
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle favorite status for content"""
    try:
        # Check if already favorited
        existing_favorite = (
            db.query(UserFavorite)
            .filter(
                and_(
                    UserFavorite.user_id == current_user.id,
                    getattr(UserFavorite, f"{content_type}_id") == content_id,
                )
            )
            .first()
        )

        if existing_favorite:
            # Remove from favorites
            db.delete(existing_favorite)
            db.commit()
            return {"message": "Removed from favorites", "is_favorited": False}
        else:
            # Add to favorites
            new_favorite = UserFavorite(
                user_id=current_user.id, **{f"{content_type}_id": content_id}
            )
            db.add(new_favorite)
            db.commit()
            return {"message": "Added to favorites", "is_favorited": True}

    except Exception as e:
        logger.error(f"Error toggling favorite: {e}")
        raise HTTPException(status_code=500, detail="Failed to toggle favorite")


@router.post("/progress")
async def update_progress(
    progress_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user's daily wellness progress"""
    try:
        today = datetime.now().date()

        # Check if progress exists for today
        existing_progress = (
            db.query(UserProgress)
            .filter(
                and_(UserProgress.user_id == current_user.id, func.date(UserProgress.date) == today)
            )
            .first()
        )

        if existing_progress:
            # Update existing progress
            for key, value in progress_data.items():
                if hasattr(existing_progress, key):
                    setattr(existing_progress, key, value)
        else:
            # Create new progress
            new_progress = UserProgress(user_id=current_user.id, **progress_data)
            db.add(new_progress)

        db.commit()
        return {"message": "Progress updated successfully"}

    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.post("/progress/public")
async def update_progress_public(progress_data: dict, db: Session = Depends(get_db)):
    """Update progress without authentication (for demo/testing)"""
    try:
        # For public endpoint, we'll create a demo user or use a default user
        # In production, you'd want proper user identification
        demo_user_id = 1  # Default user ID for demo purposes

        # Create or update progress
        existing_progress = (
            db.query(UserProgress)
            .filter(
                UserProgress.user_id == demo_user_id,
                func.date(UserProgress.date) == datetime.now().date(),
            )
            .first()
        )

        if existing_progress:
            # Update existing progress
            for key, value in progress_data.items():
                if hasattr(existing_progress, key):
                    setattr(existing_progress, key, value)
        else:
            # Create new progress entry
            new_progress = UserProgress(user_id=demo_user_id, **progress_data)
            db.add(new_progress)

        db.commit()

        # Return the updated progress data
        return {
            "message": "Progress updated successfully",
            "progress": {
                "mood_rating": progress_data.get("mood_rating"),
                "stress_level": progress_data.get("stress_level"),
                "sleep_hours": progress_data.get("sleep_hours"),
                "exercise_minutes": progress_data.get("exercise_minutes"),
                "meditation_minutes": progress_data.get("meditation_minutes"),
                "notes": progress_data.get("notes"),
                "date": datetime.now().isoformat(),
            },
        }
    except Exception as e:
        logger.error(f"Error updating public progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.get("/progress/public")
async def get_public_progress(db: Session = Depends(get_db)):
    """Get public progress data (for demo/testing)"""
    try:
        demo_user_id = 1  # Default user ID for demo purposes

        # Get today's progress
        today_progress = (
            db.query(UserProgress)
            .filter(
                UserProgress.user_id == demo_user_id,
                func.date(UserProgress.date) == datetime.now().date(),
            )
            .first()
        )

        if today_progress:
            return {
                "mood_rating": today_progress.mood_rating,
                "stress_level": today_progress.stress_level,
                "sleep_hours": today_progress.sleep_hours,
                "exercise_minutes": today_progress.exercise_minutes,
                "meditation_minutes": today_progress.meditation_minutes,
                "notes": today_progress.notes,
                "date": today_progress.date.isoformat() if today_progress.date else None,
            }
        else:
            return {
                "mood_rating": None,
                "stress_level": None,
                "sleep_hours": None,
                "exercise_minutes": None,
                "meditation_minutes": None,
                "notes": None,
                "date": None,
            }
    except Exception as e:
        logger.error(f"Error getting public progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to get progress")


# Public endpoints that don't need login
@router.get("/videos/public")
async def get_videos_public(
    category_id: Optional[int] = Query(None),
    stress_level: Optional[str] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Get stress-reduction videos without needing to log in"""
    try:
        query = db.query(Video).filter(Video.is_active == True)

        if category_id:
            query = query.filter(Video.category_id == category_id)

        if stress_level:
            query = query.filter(Video.stress_level == stress_level)

        if featured:
            query = query.filter(Video.is_featured == True)

        videos = query.order_by(Video.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "videos": [
                {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "youtube_id": video.youtube_id,
                    "thumbnail_url": video.thumbnail_url,
                    "duration": video.duration,
                    "category": {
                        "id": video.category.id,
                        "name": video.category.name,
                        "color": video.category.color,
                    },
                    "stress_level": video.stress_level,
                    "mood_boost": video.mood_boost,
                    "relaxation_score": video.relaxation_score,
                    "view_count": video.view_count,
                    "like_count": video.like_count,
                    "tags": video.tags,
                    "is_featured": video.is_featured,
                    "created_at": video.created_at.isoformat(),
                }
                for video in videos
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching public videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")


@router.get("/meal-plans/{meal_plan_id}")
async def get_meal_plan_by_id(
    meal_plan_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific meal plan by ID with full details"""
    try:
        meal_plan = (
            db.query(MealPlan)
            .filter(MealPlan.id == meal_plan_id, MealPlan.is_active == True)
            .first()
        )

        if not meal_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")

        return {
            "id": meal_plan.id,
            "title": meal_plan.title,
            "description": meal_plan.description,
            "category": {
                "id": meal_plan.category.id,
                "name": meal_plan.category.name,
                "color": meal_plan.category.color,
            },
            "difficulty": meal_plan.difficulty,
            "prep_time": meal_plan.prep_time,
            "cook_time": meal_plan.cook_time,
            "servings": meal_plan.servings,
            "calories_per_serving": meal_plan.calories_per_serving,
            "protein": meal_plan.protein,
            "carbs": meal_plan.carbs,
            "fat": meal_plan.fat,
            "stress_reduction_benefits": meal_plan.stress_reduction_benefits,
            "mood_boost_ingredients": meal_plan.mood_boost_ingredients,
            "ingredients": meal_plan.ingredients,
            "instructions": meal_plan.instructions,
            "tips": meal_plan.tips,
            "image_url": meal_plan.image_url,
            "video_url": meal_plan.video_url,
            "is_featured": meal_plan.is_featured,
            "created_at": meal_plan.created_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching meal plan {meal_plan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch meal plan")


@router.get("/meal-plans/public")
async def get_meal_plans_public(
    category_id: Optional[int] = Query(None),
    difficulty: Optional[str] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Get stress-reduction meal plans without authentication"""
    try:
        query = db.query(MealPlan).filter(MealPlan.is_active == True)

        if category_id:
            query = query.filter(MealPlan.category_id == category_id)

        if category_id:
            query = query.filter(MealPlan.category_id == category_id)

        if difficulty:
            query = query.filter(MealPlan.difficulty == difficulty)

        if featured:
            query = query.filter(MealPlan.is_featured == True)

        meal_plans = query.order_by(MealPlan.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "meal_plans": [
                {
                    "id": meal.id,
                    "title": meal.title,
                    "description": meal.description,
                    "category": {
                        "id": meal.category.id,
                        "name": meal.category.name,
                        "color": meal.category.color,
                    },
                    "difficulty": meal.difficulty,
                    "prep_time": meal.prep_time,
                    "cook_time": meal.cook_time,
                    "servings": meal.servings,
                    "calories_per_serving": meal.calories_per_serving,
                    "protein": meal.protein,
                    "carbs": meal.carbs,
                    "fat": meal.fat,
                    "stress_reduction_benefits": meal.stress_reduction_benefits,
                    "mood_boost_ingredients": meal.mood_boost_ingredients,
                    "ingredients": meal.ingredients,
                    "instructions": meal.instructions,
                    "tips": meal.tips,
                    "image_url": meal.image_url,
                    "video_url": meal.video_url,
                    "is_featured": meal.is_featured,
                    "created_at": meal.created_at.isoformat(),
                }
                for meal in meal_plans
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching public meal plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch meal plans")


@router.get("/articles/{article_id}")
async def get_article_by_id(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific article by ID with full details"""
    try:
        article = (
            db.query(Article)
            .filter(Article.id == article_id, Article.is_active == True)
            .first()
        )

        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        return {
            "id": article.id,
            "title": article.title,
            "excerpt": article.excerpt,
            "content": article.content,
            "read_time": article.read_time,
            "image_url": article.image_url,
            "video_url": article.video_url,
            "category": {
                "id": article.category.id,
                "name": article.category.name,
                "color": article.category.color,
            },
            "stress_reduction_tips": article.stress_reduction_tips,
            "practical_exercises": article.practical_exercises,
            "author": article.author,
            "author_bio": article.author_bio,
            "tags": article.tags,
            "is_featured": article.is_featured,
            "created_at": article.created_at.isoformat(),
            "updated_at": article.updated_at.isoformat() if article.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching article {article_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch article")


@router.get("/articles/public")
async def get_articles_public(
    category_id: Optional[int] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Get wellness articles without authentication"""
    try:
        query = db.query(Article).filter(Article.is_active == True)

        if category_id:
            query = query.filter(Article.category_id == category_id)

        if featured:
            query = query.filter(Article.is_featured == True)

        articles = query.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "articles": [
                {
                    "id": article.id,
                    "title": article.title,
                    "content": article.content,
                    "excerpt": article.excerpt,
                    "category": {
                        "id": article.category.id,
                        "name": article.category.name,
                        "color": article.category.color,
                    },
                    "author": article.author,
                    "read_time": article.read_time,
                    "tags": article.tags,
                    "stress_reduction_tips": article.stress_reduction_tips,
                    "practical_exercises": article.practical_exercises,
                    "image_url": article.image_url,
                    "is_featured": article.is_featured,
                    "created_at": article.created_at.isoformat(),
                }
                for article in articles
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching public articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles")


@router.get("/quotes/public")
async def get_quotes_public(
    category_id: Optional[int] = Query(None),
    featured: Optional[bool] = Query(False),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
):
    """Get motivational quotes without authentication"""
    try:
        query = db.query(Quote).filter(Quote.is_active == True)

        if category_id:
            query = query.filter(Quote.category_id == category_id)

        if featured:
            query = query.filter(Quote.is_featured == True)

        quotes = query.order_by(func.random()).limit(limit).all()

        return {
            "quotes": [
                {
                    "id": quote.id,
                    "text": quote.text,
                    "author": quote.author,
                    "category": {
                        "id": quote.category.id,
                        "name": quote.category.name,
                        "color": quote.category.color,
                    },
                    "source": quote.source,
                    "tags": quote.tags,
                    "mood_boost": quote.mood_boost,
                    "inspiration_level": quote.inspiration_level,
                    "is_featured": quote.is_featured,
                    "created_at": quote.created_at.isoformat(),
                }
                for quote in quotes
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching public quotes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quotes")
