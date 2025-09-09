import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from services.backend.app.models.content import ContentCategory, Video, MealPlan, Quote, Article, UserProgress, UserFavorite
from datetime import datetime, timedelta

@pytest.fixture
def authenticated_client(client: TestClient):
    # Create a user
    client.post(
        "/auth/signup",
        json={"email": "content_user@example.com", "password": "testpassword", "name": "Content Test User"}
    )
    # Login to get tokens
    response = client.post(
        "/auth/login",
        json={"email": "content_user@example.com", "password": "testpassword"}
    )
    access_token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {access_token}"
    yield client
    client.headers.pop("Authorization")

@pytest.fixture
def seed_content(session: Session):
    # Create categories
    cat1 = ContentCategory(name="Mindfulness", description="Mindfulness exercises", icon="brain", color="#FF5733", is_active=True, sort_order=1)
    cat2 = ContentCategory(name="Nutrition", description="Healthy eating tips", icon="apple", color="#33FF57", is_active=True, sort_order=2)
    session.add_all([cat1, cat2])
    session.commit()
    session.refresh(cat1)
    session.refresh(cat2)

    # Create videos
    video1 = Video(title="Mindful Breathing", description="A guided meditation", youtube_id="abc1", thumbnail_url="thumb1", duration=300, category_id=cat1.id, stress_level="low", mood_boost=8, is_active=True, is_featured=True)
    video2 = Video(title="Healthy Recipes", description="Quick and easy meals", youtube_id="def2", thumbnail_url="thumb2", duration=600, category_id=cat2.id, stress_level="medium", mood_boost=7, is_active=True, is_featured=False)
    session.add_all([video1, video2])
    session.commit()
    session.refresh(video1)
    session.refresh(video2)

    # Create meal plans
    meal1 = MealPlan(title="Vegan Delight", description="Plant-based meal plan", difficulty="easy", prep_time=20, cook_time=30, servings=2, calories_per_serving=500, protein=20, carbs=60, fat=15, ingredients="Tofu, veggies", instructions="Cook well", tips="Enjoy!", image_url="img1", video_url="vid1", category_id=cat2.id, is_active=True, is_featured=True)
    session.add(meal1)
    session.commit()
    session.refresh(meal1)

    # Create quotes
    quote1 = Quote(text="Be present.", author="Zen Master", category_id=cat1.id, source="Book", tags="mindfulness", mood_boost=9, inspiration_level=10, is_active=True, is_featured=True)
    session.add(quote1)
    session.commit()
    session.refresh(quote1)

    # Create articles
    article1 = Article(title="The Power of Meditation", content="Meditation benefits...", excerpt="Short intro", read_time=5, image_url="art_img1", video_url="art_vid1", category_id=cat1.id, stress_reduction_tips="Breathe deep", practical_exercises="Focus", author="Dr. Calm", author_bio="Expert", tags="meditation", is_active=True, is_featured=True)
    session.add(article1)
    session.commit()
    session.refresh(article1)

    # Create a demo user for public progress
    demo_user = session.query(User).filter(User.id == 1).first()
    if not demo_user:
        demo_user = User(id=1, email="demo@example.com", password="demopassword", name="Demo User", role="user", is_onboarding_complete=True)
        session.add(demo_user)
        session.commit()
        session.refresh(demo_user)

    # Create user progress for demo user
    today = datetime.now().date()
    progress1 = UserProgress(user_id=demo_user.id, date=today, mood_rating=7, stress_level=5, sleep_hours=8, exercise_minutes=30, meditation_minutes=10, notes="Good day")
    session.add(progress1)
    session.commit()
    session.refresh(progress1)

    return {
        "cat1": cat1, "cat2": cat2,
        "video1": video1, "video2": video2,
        "meal1": meal1,
        "quote1": quote1,
        "article1": article1,
        "demo_user": demo_user,
        "progress1": progress1
    }

def test_get_content_categories(client: TestClient, seed_content):
    response = client.get("/content/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert len(data["categories"]) >= 2
    assert any(cat["name"] == "Mindfulness" for cat in data["categories"])

def test_get_home_content_public(client: TestClient, seed_content):
    response = client.get("/content/home-content")
    assert response.status_code == 200
    data = response.json()
    assert "featured_videos" in data
    assert "featured_meal_plans" in data
    assert "daily_quote" in data
    assert "featured_articles" in data
    assert "user_progress" in data

    assert any(video["title"] == "Mindful Breathing" for video in data["featured_videos"])
    assert data["daily_quote"]["text"] == "Be present."
    assert data["user_progress"]["mood_rating"] == 7

def test_get_videos_public(client: TestClient, seed_content):
    response = client.get("/content/videos/public")
    assert response.status_code == 200
    data = response.json()
    assert "videos" in data
    assert len(data["videos"]) >= 1
    assert any(video["title"] == "Mindful Breathing" for video in data["videos"])

def test_get_meal_plans_public(client: TestClient, seed_content):
    response = client.get("/content/meal-plans/public")
    assert response.status_code == 200
    data = response.json()
    assert "meal_plans" in data
    assert len(data["meal_plans"]) >= 1
    assert any(meal["title"] == "Vegan Delight" for meal in data["meal_plans"])

def test_get_quotes_public(client: TestClient, seed_content):
    response = client.get("/content/quotes/public")
    assert response.status_code == 200
    data = response.json()
    assert "quotes" in data
    assert len(data["quotes"]) >= 1
    assert any(quote["text"] == "Be present." for quote in data["quotes"])

def test_get_articles_public(client: TestClient, seed_content):
    response = client.get("/content/articles/public")
    assert response.status_code == 200
    data = response.json()
    assert "articles" in data
    assert len(data["articles"]) >= 1
    assert any(article["title"] == "The Power of Meditation" for article in data["articles"])

def test_toggle_favorite(authenticated_client: TestClient, seed_content, session: Session):
    video_id = seed_content["video1"].id
    user_id = authenticated_client.get("/users/me").json()["id"]

    # Add to favorites
    response = authenticated_client.post(f"/content/favorites/video/{video_id}")
    assert response.status_code == 200
    assert response.json()["is_favorited"] is True

    # Verify in DB
    favorite = session.query(UserFavorite).filter_by(user_id=user_id, video_id=video_id).first()
    assert favorite is not None

    # Remove from favorites
    response = authenticated_client.post(f"/content/favorites/video/{video_id}")
    assert response.status_code == 200
    assert response.json()["is_favorited"] is False

    # Verify removed from DB
    favorite = session.query(UserFavorite).filter_by(user_id=user_id, video_id=video_id).first()
    assert favorite is None

def test_update_progress(authenticated_client: TestClient, seed_content, session: Session):
    user_id = authenticated_client.get("/users/me").json()["id"]
    today = datetime.now().date()

    # Initial progress (should not exist for this new user)
    initial_progress = session.query(UserProgress).filter_by(user_id=user_id, date=today).first()
    assert initial_progress is None

    # Create new progress
    progress_data = {"mood_rating": 9, "stress_level": 2, "sleep_hours": 7}
    response = authenticated_client.post("/content/progress", json=progress_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Progress updated successfully"

    # Verify in DB
    updated_progress = session.query(UserProgress).filter_by(user_id=user_id, date=today).first()
    assert updated_progress is not None
    assert updated_progress.mood_rating == 9
    assert updated_progress.stress_level == 2
    assert updated_progress.sleep_hours == 7

    # Update existing progress
    update_data = {"mood_rating": 10, "exercise_minutes": 45}
    response = authenticated_client.post("/content/progress", json=update_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Progress updated successfully"

    # Verify update in DB
    updated_progress = session.query(UserProgress).filter_by(user_id=user_id, date=today).first()
    assert updated_progress.mood_rating == 10
    assert updated_progress.exercise_minutes == 45
    assert updated_progress.stress_level == 2 # Should remain unchanged if not provided in update

def test_update_progress_public(client: TestClient, seed_content, session: Session):
    demo_user_id = seed_content["demo_user"].id
    today = datetime.now().date()

    # Update existing public progress
    progress_data = {"mood_rating": 8, "stress_level": 3}
    response = client.post("/content/progress/public", json=progress_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Progress updated successfully"
    assert response.json()["progress"]["mood_rating"] == 8

    # Verify in DB
    updated_progress = session.query(UserProgress).filter_by(user_id=demo_user_id, date=today).first()
    assert updated_progress.mood_rating == 8
    assert updated_progress.stress_level == 3

def test_get_public_progress(client: TestClient, seed_content):
    response = client.get("/content/progress/public")
    assert response.status_code == 200
    data = response.json()
    assert data["mood_rating"] == 7 # From seed_content
    assert data["stress_level"] == 5