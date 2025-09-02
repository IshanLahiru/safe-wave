#!/usr/bin/env python3
"""
Script to seed the database with stress-reduction content
"""

import os
import sys
from datetime import datetime, timezone

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from app.models.content import Article, ContentCategory, MealPlan, Quote, Video


def seed_content():
    """Seed the database with stress-reduction content"""
    db = SessionLocal()

    try:
        print("🌱 Seeding stress-reduction content...")

        # Create content categories
        categories = [
            {
                "name": "Meditation & Mindfulness",
                "description": "Guided meditation and mindfulness practices",
                "icon": "brain.head.profile",
                "color": "#4CAF50",
                "sort_order": 1,
            },
            {
                "name": "Relaxation & Sleep",
                "description": "Content to help you relax and sleep better",
                "icon": "bed.double.fill",
                "color": "#2196F3",
                "sort_order": 2,
            },
            {
                "name": "Stress Relief",
                "description": "Techniques and activities to reduce stress",
                "icon": "heart.fill",
                "color": "#FF9800",
                "sort_order": 3,
            },
            {
                "name": "Healthy Eating",
                "description": "Nutritious meals that support mental health",
                "icon": "leaf.fill",
                "color": "#8BC34A",
                "sort_order": 4,
            },
            {
                "name": "Exercise & Movement",
                "description": "Physical activities for mental wellness",
                "icon": "figure.walk",
                "color": "#E91E63",
                "sort_order": 5,
            },
            {
                "name": "Inspiration & Motivation",
                "description": "Uplifting content to boost your mood",
                "icon": "star.fill",
                "color": "#FFD700",
                "sort_order": 6,
            },
        ]

        # Create categories
        category_objects = {}
        for cat_data in categories:
            category = ContentCategory(**cat_data)
            db.add(category)
            db.flush()  # Get the ID
            category_objects[cat_data["name"]] = category

        print("✅ Created content categories")

        # Create videos
        videos = [
            {
                "title": "10 Minute Meditation for Beginners",
                "description": "A gentle introduction to meditation for stress relief",
                "youtube_id": "inpok4MKVLM",
                "thumbnail_url": "https://img.youtube.com/vi/inpok4MKVLM/maxresdefault.jpg",
                "duration": 600,
                "category_id": category_objects["Meditation & Mindfulness"].id,
                "stress_level": "high",
                "mood_boost": 8.5,
                "relaxation_score": 9.0,
                "tags": ["meditation", "beginners", "stress-relief"],
                "is_featured": True,
            },
            {
                "title": "Deep Breathing Exercise for Anxiety",
                "description": "Simple breathing technique to calm your mind",
                "youtube_id": "aXIt9sF6xqo",
                "thumbnail_url": "https://img.youtube.com/vi/aXIt9sF6xqo/maxresdefault.jpg",
                "duration": 480,
                "category_id": category_objects["Stress Relief"].id,
                "stress_level": "high",
                "mood_boost": 7.5,
                "relaxation_score": 8.5,
                "tags": ["breathing", "anxiety", "calm"],
                "is_featured": True,
            },
            {
                "title": "Sleep Music: Deep Relaxation",
                "description": "Soothing sounds to help you fall asleep",
                "youtube_id": "1ZYbU82GVz4",
                "thumbnail_url": "https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg",
                "duration": 3600,
                "category_id": category_objects["Relaxation & Sleep"].id,
                "stress_level": "medium",
                "mood_boost": 6.5,
                "relaxation_score": 9.5,
                "tags": ["sleep", "relaxation", "music"],
                "is_featured": True,
            },
            {
                "title": "Gentle Yoga for Stress Relief",
                "description": "Easy yoga poses to release tension",
                "youtube_id": "VaoV1PrYFW4",
                "thumbnail_url": "https://img.youtube.com/vi/VaoV1PrYFW4/maxresdefault.jpg",
                "duration": 900,
                "category_id": category_objects["Exercise & Movement"].id,
                "stress_level": "medium",
                "mood_boost": 8.0,
                "relaxation_score": 8.0,
                "tags": ["yoga", "gentle", "stress-relief"],
                "is_featured": False,
            },
            {
                "title": "Mindful Walking Meditation",
                "description": "Combine movement with mindfulness",
                "youtube_id": "kQpJvJb1dQY",
                "thumbnail_url": "https://img.youtube.com/vi/kQpJvJb1dQY/maxresdefault.jpg",
                "duration": 720,
                "category_id": category_objects["Meditation & Mindfulness"].id,
                "stress_level": "low",
                "mood_boost": 7.0,
                "relaxation_score": 7.5,
                "tags": ["walking", "meditation", "mindfulness"],
                "is_featured": False,
            },
        ]

        for video_data in videos:
            video = Video(**video_data)
            db.add(video)

        print("✅ Created videos")

        # Create meal plans
        meal_plans = [
            {
                "title": "Calming Chamomile Tea & Honey Toast",
                "description": "A soothing breakfast to start your day peacefully",
                "category_id": category_objects["Healthy Eating"].id,
                "difficulty": "easy",
                "prep_time": 5,
                "cook_time": 3,
                "servings": 1,
                "calories_per_serving": 180,
                "protein": 6.0,
                "carbs": 28.0,
                "fat": 4.0,
                "stress_reduction_benefits": [
                    "chamomile reduces anxiety",
                    "honey provides natural energy",
                ],
                "mood_boost_ingredients": ["chamomile", "honey", "whole grain bread"],
                "ingredients": [
                    "1 chamomile tea bag",
                    "1 slice whole grain bread",
                    "1 tbsp honey",
                    "1 tsp butter",
                    "1 cup hot water",
                ],
                "instructions": [
                    "Boil water and steep chamomile tea for 3-5 minutes",
                    "Toast bread until golden brown",
                    "Spread with butter and drizzle with honey",
                    "Enjoy with your calming tea",
                ],
                "tips": "Take your time to savor each bite and sip mindfully",
                "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400",
                "is_featured": True,
            },
            {
                "title": "Stress-Relief Smoothie Bowl",
                "description": "Nutrient-rich smoothie bowl with mood-boosting ingredients",
                "category_id": category_objects["Healthy Eating"].id,
                "difficulty": "easy",
                "prep_time": 10,
                "cook_time": 0,
                "servings": 1,
                "calories_per_serving": 320,
                "protein": 12.0,
                "carbs": 45.0,
                "fat": 8.0,
                "stress_reduction_benefits": [
                    "bananas contain tryptophan",
                    "berries are rich in antioxidants",
                ],
                "mood_boost_ingredients": ["banana", "berries", "almonds", "dark chocolate"],
                "ingredients": [
                    "1 frozen banana",
                    "1/2 cup mixed berries",
                    "1/4 cup almond milk",
                    "1 tbsp almond butter",
                    "1 tbsp dark chocolate chips",
                    "1 tbsp granola",
                ],
                "instructions": [
                    "Blend frozen banana, berries, and almond milk until smooth",
                    "Pour into a bowl",
                    "Top with almond butter, chocolate chips, and granola",
                    "Enjoy immediately",
                ],
                "tips": "The cold temperature and creamy texture can be very soothing",
                "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
                "is_featured": True,
            },
        ]

        for meal_data in meal_plans:
            meal = MealPlan(**meal_data)
            db.add(meal)

        print("✅ Created meal plans")

        # Create quotes
        quotes = [
            {
                "text": "Peace comes from within. Do not seek it without.",
                "author": "Buddha",
                "category_id": category_objects["Inspiration & Motivation"].id,
                "source": "Buddhist teachings",
                "tags": ["peace", "inner-peace", "mindfulness"],
                "mood_boost": 8.5,
                "inspiration_level": 9.0,
                "is_featured": True,
            },
            {
                "text": "The only way to do great work is to love what you do.",
                "author": "Steve Jobs",
                "category_id": category_objects["Inspiration & Motivation"].id,
                "source": "Stanford Commencement Speech",
                "tags": ["passion", "work", "motivation"],
                "mood_boost": 7.5,
                "inspiration_level": 8.5,
                "is_featured": True,
            },
            {
                "text": "Happiness is not something ready-made. It comes from your own actions.",
                "author": "Dalai Lama",
                "category_id": category_objects["Inspiration & Motivation"].id,
                "source": "The Art of Happiness",
                "tags": ["happiness", "actions", "mindfulness"],
                "mood_boost": 8.0,
                "inspiration_level": 8.0,
                "is_featured": False,
            },
            {
                "text": "Take life day by day and be grateful for the little things.",
                "author": "Anonymous",
                "category_id": category_objects["Inspiration & Motivation"].id,
                "source": "Traditional wisdom",
                "tags": ["gratitude", "daily-life", "mindfulness"],
                "mood_boost": 7.0,
                "inspiration_level": 7.5,
                "is_featured": False,
            },
            {
                "text": "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
                "author": "Thich Nhat Hanh",
                "category_id": category_objects["Meditation & Mindfulness"].id,
                "source": "Peace Is Every Step",
                "tags": ["present-moment", "joy", "mindfulness"],
                "mood_boost": 8.5,
                "inspiration_level": 8.0,
                "is_featured": False,
            },
        ]

        for quote_data in quotes:
            quote = Quote(**quote_data)
            db.add(quote)

        print("✅ Created quotes")

        # Create articles
        articles = [
            {
                "title": "5 Simple Breathing Techniques for Instant Stress Relief",
                "content": """
                Stress is a natural part of life, but it doesn't have to control you. These five simple breathing techniques can help you find calm in just a few minutes.

                1. **4-7-8 Breathing**: Inhale for 4 counts, hold for 7, exhale for 8. This technique activates your parasympathetic nervous system, promoting relaxation.

                2. **Box Breathing**: Inhale for 4, hold for 4, exhale for 4, hold for 4. This creates a balanced breathing pattern that can reduce anxiety.

                3. **Diaphragmatic Breathing**: Place one hand on your chest and one on your belly. Breathe deeply so your belly rises more than your chest.

                4. **Alternate Nostril Breathing**: Close one nostril, inhale through the other, then switch. This balances your nervous system.

                5. **Progressive Relaxation**: Combine deep breathing with tensing and relaxing muscle groups.

                Practice these techniques daily for best results. Even 5 minutes can make a significant difference in your stress levels.
                """,
                "excerpt": "Learn five powerful breathing techniques that can help you reduce stress and find calm in just a few minutes.",
                "category_id": category_objects["Stress Relief"].id,
                "author": "Wellness Team",
                "read_time": 5,
                "tags": ["breathing", "stress-relief", "techniques"],
                "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
                "stress_reduction_tips": [
                    "Practice in a quiet space",
                    "Start with just 2-3 minutes",
                    "Focus on the sensation of breathing",
                    "Be patient with yourself",
                ],
                "practical_exercises": [
                    "Morning breathing routine",
                    "Mid-day stress reset",
                    "Evening relaxation practice",
                ],
                "is_featured": True,
            },
            {
                "title": "The Science of Sleep: How to Improve Your Rest Quality",
                "content": """
                Quality sleep is essential for mental health and stress management. Understanding the science behind sleep can help you optimize your rest.

                **The Sleep Cycle**: Your body goes through multiple sleep cycles each night, including REM (rapid eye movement) and non-REM sleep. Each cycle lasts about 90 minutes.

                **Tips for Better Sleep**:
                - Maintain a consistent sleep schedule
                - Create a relaxing bedtime routine
                - Keep your bedroom cool and dark
                - Avoid screens 1 hour before bed
                - Exercise regularly, but not too close to bedtime

                **Sleep Hygiene Practices**:
                1. Set a regular bedtime and wake time
                2. Create a comfortable sleep environment
                3. Limit caffeine and alcohol
                4. Practice relaxation techniques
                5. Use your bed only for sleep and intimacy

                **When to Seek Help**: If you consistently have trouble sleeping for more than a few weeks, consider consulting a healthcare provider.
                """,
                "excerpt": "Discover the science behind sleep and learn practical strategies to improve your sleep quality for better mental health.",
                "category_id": category_objects["Relaxation & Sleep"].id,
                "author": "Sleep Specialist",
                "read_time": 8,
                "tags": ["sleep", "mental-health", "wellness"],
                "image_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400",
                "stress_reduction_tips": [
                    "Create a bedtime ritual",
                    "Use calming scents like lavender",
                    "Try progressive muscle relaxation",
                    "Keep a sleep journal",
                ],
                "practical_exercises": [
                    "Evening wind-down routine",
                    "Sleep environment audit",
                    "Sleep schedule optimization",
                ],
                "is_featured": True,
            },
        ]

        for article_data in articles:
            article = Article(**article_data)
            db.add(article)

        print("✅ Created articles")

        # Commit all changes
        db.commit()
        print("🎉 Successfully seeded all content!")

        # Print summary
        print(f"\n📊 Content Summary:")
        print(f"   Categories: {len(categories)}")
        print(f"   Videos: {len(videos)}")
        print(f"   Meal Plans: {len(meal_plans)}")
        print(f"   Quotes: {len(quotes)}")
        print(f"   Articles: {len(articles)}")

    except Exception as e:
        print(f"❌ Error seeding content: {e}")
        db.rollback()
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_content()
