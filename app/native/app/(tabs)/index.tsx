import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsetsSafe } from '@/hooks/useSafeAreaInsetsSafe';
import { ThemedText } from '@/components/ThemedText';

import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

// Enhanced interfaces for better type safety
interface ContentCategory {
  id: number;
  name: string;
  color: string;
}

interface Video {
  id: number;
  title: string;
  description: string;
  youtube_id: string;
  thumbnail_url: string;
  duration: number;
  category: ContentCategory;
  stress_level: string;
  mood_boost: number;
  is_favorite?: boolean;
}

interface MealPlan {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  prep_time: number;
  cook_time?: number;
  servings?: number;
  calories_per_serving?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  stress_reduction_benefits?: string[];
  mood_boost_ingredients?: string[];
  ingredients?: string[];
  instructions?: string[];
  tips?: string;
  image_url: string;
  video_url?: string | null;
  category: ContentCategory;
  is_featured?: boolean;
  created_at?: string;
  is_favorite?: boolean;
}

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  read_time: number;
  image_url: string;
  video_url?: string | null;
  category: ContentCategory;
  stress_reduction_tips?: string[];
  practical_exercises?: string[];
  author?: string;
  author_bio?: string;
  tags?: string[];
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string | null;
  is_favorite?: boolean;
}

interface Quote {
  id: number;
  text: string;
  author: string;
  category: ContentCategory;
}

interface HomeContent {
  featured_videos: {
    id: number;
    title: string;
    description: string;
    youtube_id: string;
    thumbnail_url: string;
    duration: number;
    category: {
      id: number;
      name: string;
      color: string;
    };
    stress_level: string;
    mood_boost: number;
  }[];
  featured_meal_plans: {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    prep_time: number;
    cook_time?: number;
    servings?: number;
    calories_per_serving?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    stress_reduction_benefits?: string[];
    mood_boost_ingredients?: string[];
    ingredients?: string[];
    instructions?: string[];
    tips?: string;
    image_url: string;
    video_url?: string | null;
    category: {
      id: number;
      name: string;
      color: string;
    };
  }[];
  daily_quote: {
    id: number;
    text: string;
    author: string;
    category: {
      id: number;
      name: string;
      color: string;
    };
  } | null;
  featured_articles: {
    id: number;
    title: string;
    excerpt: string;
    read_time: number;
    image_url: string;
    category: {
      id: number;
      name: string;
      color: string;
    };
    stress_reduction_tips?: string[];
    practical_exercises?: string[];
    author?: string;
    tags?: string[];
  }[];
  user_progress: {
    mood_rating: number | null;
    stress_level: number | null;
    sleep_hours: number | null;
    exercise_minutes: number | null;
    meditation_minutes: number | null;
    notes?: string;
  } | null;
}

export default function HomeScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsetsSafe();
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for enhanced functionality
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showAllMealPlans, setShowAllMealPlans] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Content lists for expanded sections
  const [contentLists, setContentLists] = useState<{
    videos: Video[];
    articles: Article[];
    mealPlans: MealPlan[];
    quotes: Quote[];
  }>({
    videos: [],
    articles: [],
    mealPlans: [],
    quotes: [],
  });

  // Loading states for expanded sections
  const [expandedLoading, setExpandedLoading] = useState<{
    videos: boolean;
    articles: boolean;
    mealPlans: boolean;
    quotes: boolean;
  }>({
    videos: false,
    articles: false,
    mealPlans: false,
    quotes: false,
  });

  // Meal plan modal state
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanModalLoading, setMealPlanModalLoading] = useState(false);

  // Progress tracking state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({
    mood_rating: 5,
    stress_level: 5,
    sleep_hours: 7,
    exercise_minutes: 30,
    meditation_minutes: 15,
    notes: '',
  });
  const [progressSubmitting, setProgressSubmitting] = useState(false);

  // Wellness tip modal state
  const [showWellnessTipModal, setShowWellnessTipModal] = useState(false);
  const [selectedWellnessTip, setSelectedWellnessTip] = useState<Article | null>(null);

  // Article modal state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleModalLoading, setArticleModalLoading] = useState(false);

  const fetchHomeContent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching home content...');

      // Test the API endpoint first
      console.log('Testing API endpoint...');
      const testResponse = await fetch('http://192.168.31.14:9000/content/home-content');
      console.log('Test response status:', testResponse.status);

      if (!testResponse.ok) {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
      }

      const testData = await testResponse.json();
      console.log('Test data received:', testData);

      // Now use the apiService
      const response = await apiService.request<HomeContent>('/content/home-content');
      console.log('Home content received via apiService:', response);
      setHomeContent(response);

      // Initialize content lists with featured content
      setContentLists({
        videos: response.featured_videos || [],
        articles: response.featured_articles || [],
        mealPlans: response.featured_meal_plans || [],
        quotes: response.daily_quote ? [response.daily_quote] : [],
      });
    } catch (err) {
      console.error('Failed to fetch home content:', err);
      setError(`Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeContent();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHomeContent();
  }, []);

  const openYouTubeVideo = (youtubeId: string) => {
    const url = `https://www.youtube.com/watch?v=${youtubeId}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open video');
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMoodEmoji = (rating: number) => {
    if (rating >= 8) return '😊';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '😔';
    return '😢';
  };

  const closeDocumentViewer = () => {
    setShowDocumentViewer(false);
    setSelectedDocument(null);
  };

  // Progress tracking functions

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setProgressForm({
      mood_rating: 5,
      stress_level: 5,
      sleep_hours: 7,
      exercise_minutes: 30,
      meditation_minutes: 15,
      notes: '',
    });
  };

  const openWellnessTipModal = (article: Article) => {
    setSelectedWellnessTip(article);
    setShowWellnessTipModal(true);
  };

  const closeWellnessTipModal = () => {
    setShowWellnessTipModal(false);
    setSelectedWellnessTip(null);
  };

  const openArticleModal = async (article: Article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);

    // If the article doesn't have full content, fetch it from the API
    if (!article.content) {
      setArticleModalLoading(true);
      try {
        const response = await apiService.request(`/content/articles/${article.id}`);
        if (response && typeof response === 'object') {
          setSelectedArticle(response as Article);
        }
      } catch (error) {
        console.error('Failed to fetch article details:', error);
        // Use the existing article data if API call fails
      } finally {
        setArticleModalLoading(false);
      }
    }
  };

  const closeArticleModal = () => {
    setShowArticleModal(false);
    setSelectedArticle(null);
    setArticleModalLoading(false);
  };

  // Meal plan modal functions
  const openMealPlanModal = async (mealPlan: MealPlan) => {
    // If the meal plan doesn't have full details, fetch them
    if (
      !mealPlan.ingredients ||
      !mealPlan.instructions ||
      mealPlan.ingredients.length === 0 ||
      mealPlan.instructions.length === 0
    ) {
      try {
        setMealPlanModalLoading(true);
        const response = await apiService.request(`/content/meal-plans/${mealPlan.id}`);
        if (response && typeof response === 'object') {
          // Merge the response with the original meal plan to ensure all required fields are present
          const fullMealPlan: MealPlan = {
            ...mealPlan,
            ...response,
          };
          setSelectedMealPlan(fullMealPlan);
        } else {
          setSelectedMealPlan(mealPlan);
        }
      } catch (err) {
        console.error('Failed to fetch full meal plan details:', err);
        setSelectedMealPlan(mealPlan);
      } finally {
        setMealPlanModalLoading(false);
      }
    } else {
      setSelectedMealPlan(mealPlan);
    }

    setShowMealPlanModal(true);
  };

  const closeMealPlanModal = () => {
    setShowMealPlanModal(false);
    setSelectedMealPlan(null);
  };

  const updateProgress = async () => {
    try {
      setProgressSubmitting(true);

      // Use the public progress endpoint
      const response = await apiService.request('/content/progress/public', {
        method: 'POST',
        body: JSON.stringify(progressForm),
      });

      console.log('Progress updated:', response);

      // Update local state with the response data
      if (homeContent && response && typeof response === 'object' && 'progress' in response) {
        const updatedContent = {
          ...homeContent,
          user_progress: {
            ...homeContent.user_progress,
            ...(response as any).progress,
          },
        };
        setHomeContent(updatedContent);
      }

      closeProgressModal();
      Alert.alert('Success', 'Your progress has been updated!');
    } catch (err) {
      console.error('Failed to update progress:', err);
      Alert.alert('Error', 'Failed to update progress. Please try again.');
    } finally {
      setProgressSubmitting(false);
    }
  };

  const handleProgressChange = (field: string, value: any) => {
    setProgressForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to fetch all videos when section is expanded
  const fetchAllVideos = async () => {
    try {
      setExpandedLoading(prev => ({ ...prev, videos: true }));
      const response = await apiService.request('/content/videos/public?limit=50');
      if (response && typeof response === 'object' && 'videos' in response) {
        const responseData = response as any;
        if (Array.isArray(responseData.videos)) {
          setContentLists(prev => ({
            ...prev,
            videos: responseData.videos,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch all videos:', err);
    } finally {
      setExpandedLoading(prev => ({ ...prev, videos: false }));
    }
  };

  // Function to fetch all meal plans when section is expanded
  const fetchAllMealPlans = async () => {
    try {
      setExpandedLoading(prev => ({ ...prev, mealPlans: true }));
      const response = await apiService.request('/content/meal-plans/public?limit=50');
      if (response && typeof response === 'object' && 'meal_plans' in response) {
        const responseData = response as any;
        if (Array.isArray(responseData.meal_plans)) {
          setContentLists(prev => ({
            ...prev,
            mealPlans: responseData.meal_plans,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch all meal plans:', err);
    } finally {
      setExpandedLoading(prev => ({ ...prev, mealPlans: false }));
    }
  };

  if (loading && !homeContent) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={Colors.dark.primary} />
        <ThemedText style={styles.loadingText}>Loading your wellness content...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeContent}>
            <IconSymbol size={40} name='heart.fill' color={Colors.dark.background} />
            <View style={styles.welcomeText}>
              <ThemedText type='title' style={styles.welcomeTitle}>
                Welcome back, {user?.name?.split(' ')[0] || 'Friend'}! 🌟
              </ThemedText>
              <ThemedText type='body' style={styles.welcomeSubtitle}>
                Let's make today a peaceful one
              </ThemedText>
            </View>
          </View>
        </View>

        {error && (
          <ModernCard variant='outlined' style={styles.errorCard}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchHomeContent}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ModernCard>
        )}

        {/* Daily Quote - Dynamic from API */}
        {homeContent?.daily_quote ? (
          <ModernCard variant='elevated' style={styles.quoteCard}>
            <View style={styles.quoteContent}>
              <IconSymbol size={24} name='quote.bubble.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.quoteText}>
                "{homeContent.daily_quote.text}"
              </ThemedText>
              <ThemedText type='caption' style={styles.quoteAuthor}>
                — {homeContent.daily_quote.author}
              </ThemedText>
            </View>
          </ModernCard>
        ) : (
          <ModernCard variant='elevated' style={styles.quoteCard}>
            <View style={styles.quoteContent}>
              <IconSymbol size={24} name='quote.bubble.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.quoteText}>
                "Peace comes from within. Do not seek it without."
              </ThemedText>
              <ThemedText type='caption' style={styles.quoteAuthor}>
                — Buddha
              </ThemedText>
            </View>
          </ModernCard>
        )}

        {/* Wellness Tip of the Day */}
        {homeContent?.featured_articles && homeContent.featured_articles.length > 0 && (
          <TouchableOpacity
            onPress={() => openWellnessTipModal(homeContent.featured_articles[0])}
            activeOpacity={0.8}
          >
            <ModernCard variant='elevated' style={styles.wellnessTipCard}>
              <View style={styles.wellnessTipContent}>
                <View style={styles.wellnessTipHeader}>
                  <IconSymbol size={24} name='lightbulb.fill' color={Colors.dark.warning} />
                  <ThemedText type='body' style={styles.wellnessTipTitle}>
                    Wellness Tip of the Day
                  </ThemedText>
                  <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
                </View>
                {homeContent.featured_articles[0]?.stress_reduction_tips &&
                  homeContent.featured_articles[0].stress_reduction_tips.length > 0 && (
                    <ThemedText type='body' style={styles.wellnessTipText}>
                      💡 {homeContent.featured_articles[0].stress_reduction_tips[0]}
                    </ThemedText>
                  )}
                <View style={styles.wellnessTipFooter}>
                  <ThemedText type='caption' style={styles.wellnessTipSource}>
                    From: {homeContent.featured_articles[0]?.title}
                  </ThemedText>
                  {homeContent.featured_articles[0]?.author && (
                    <ThemedText type='caption' style={styles.wellnessTipAuthor}>
                      by {homeContent.featured_articles[0].author}
                    </ThemedText>
                  )}
                </View>
              </View>
            </ModernCard>
          </TouchableOpacity>
        )}

        {/* Featured Videos - Dynamic from API */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type='heading' style={styles.sectionTitle}>
              Relaxing Videos 🎬
            </ThemedText>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={async () => {
                if (!showAllVideos) {
                  // Fetch all videos when expanding
                  await fetchAllVideos();
                }
                setShowAllVideos(!showAllVideos);
              }}
            >
              <ThemedText type='caption' style={styles.viewAllButtonText}>
                {showAllVideos ? 'Show Less' : 'View All'}
              </ThemedText>
              <IconSymbol
                size={16}
                name={showAllVideos ? 'chevron.up' : 'chevron.right'}
                color={Colors.dark.primary}
              />
            </TouchableOpacity>
          </View>

          {homeContent?.featured_videos && homeContent.featured_videos.length > 0 ? (
            <>
              {/* Horizontal scroll for featured videos */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {homeContent.featured_videos.map(video => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.videoCard}
                    onPress={() => openYouTubeVideo(video.youtube_id)}
                  >
                    <View style={styles.videoThumbnail}>
                      <Image
                        source={{
                          uri:
                            video.thumbnail_url ||
                            'https://via.placeholder.com/300x120/4A90E2/FFFFFF?text=Video',
                        }}
                        style={styles.thumbnailImage}
                        resizeMode='cover'
                        defaultSource={{
                          uri: 'https://via.placeholder.com/300x120/4A90E2/FFFFFF?text=Video',
                        }}
                      />
                      <View style={styles.videoOverlay}>
                        <IconSymbol size={24} name='play.fill' color={Colors.dark.background} />
                      </View>
                      <View style={styles.videoDuration}>
                        <ThemedText type='caption' style={styles.durationText}>
                          {formatDuration(video.duration)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.videoInfo}>
                      <ThemedText type='body' style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </ThemedText>
                      <View style={styles.videoMeta}>
                        <View
                          style={[styles.stressLevel, { backgroundColor: video.category.color }]}
                        >
                          <ThemedText type='caption' style={styles.stressLevelText}>
                            {video.stress_level}
                          </ThemedText>
                        </View>
                        <ThemedText type='caption' style={styles.moodBoost}>
                          😊 +{video.mood_boost}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Expanded videos view */}
              {showAllVideos && (
                <View style={styles.expandedSection}>
                  <ThemedText type='body' style={styles.expandedTitle}>
                    All Videos
                  </ThemedText>

                  {expandedLoading.videos ? (
                    <View style={styles.expandedLoading}>
                      <ActivityIndicator size='large' color={Colors.dark.primary} />
                      <ThemedText type='body' style={styles.expandedLoadingText}>
                        Loading all videos...
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.videoGrid}>
                      {contentLists.videos.map(video => (
                        <TouchableOpacity
                          key={`expanded-${video.id}`}
                          style={styles.expandedVideoCard}
                          onPress={() => openYouTubeVideo(video.youtube_id)}
                        >
                          <View style={styles.expandedVideoThumbnail}>
                            <Image
                              source={{
                                uri:
                                  video.thumbnail_url ||
                                  'https://via.placeholder.com/200x120/4A90E2/FFFFFF?text=Video',
                              }}
                              style={styles.expandedThumbnailImage}
                              resizeMode='cover'
                            />
                            <View style={styles.videoOverlay}>
                              <IconSymbol
                                size={20}
                                name='play.fill'
                                color={Colors.dark.background}
                              />
                            </View>
                          </View>
                          <View style={styles.expandedVideoInfo}>
                            <ThemedText
                              type='caption'
                              style={styles.expandedVideoTitle}
                              numberOfLines={2}
                            >
                              {video.title}
                            </ThemedText>
                            <View style={styles.expandedVideoMeta}>
                              <View
                                style={[
                                  styles.stressLevel,
                                  { backgroundColor: video.category.color },
                                ]}
                              >
                                <ThemedText type='caption' style={styles.stressLevelText}>
                                  {video.stress_level}
                                </ThemedText>
                              </View>
                              <ThemedText type='caption' style={styles.moodBoost}>
                                😊 +{video.mood_boost}
                              </ThemedText>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <ModernCard variant='elevated' style={styles.placeholderCard}>
              <ThemedText type='body' style={styles.placeholderText}>
                {error ? 'Failed to load videos' : 'Loading videos...'}
              </ThemedText>
              {error && (
                <TouchableOpacity style={styles.retryButton} onPress={fetchHomeContent}>
                  <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              )}
            </ModernCard>
          )}
        </View>

        {/* Featured Meal Plans - Dynamic from API */}
        {homeContent?.featured_meal_plans && homeContent.featured_meal_plans.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type='heading' style={styles.sectionTitle}>
                Nourishing Meals 🍽️
              </ThemedText>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={async () => {
                  if (!showAllMealPlans) {
                    // Fetch all meal plans when expanding
                    await fetchAllMealPlans();
                  }
                  setShowAllMealPlans(!showAllMealPlans);
                }}
              >
                <ThemedText type='caption' style={styles.viewAllButtonText}>
                  {showAllMealPlans ? 'Show Less' : 'View All'}
                </ThemedText>
                <IconSymbol
                  size={16}
                  name={showAllMealPlans ? 'chevron.up' : 'chevron.right'}
                  color={Colors.dark.primary}
                />
              </TouchableOpacity>
            </View>
            {homeContent.featured_meal_plans.map(meal => (
              <TouchableOpacity key={meal.id} onPress={() => openMealPlanModal(meal)}>
                <ModernCard variant='elevated' style={styles.mealCard}>
                  <View style={styles.mealContent}>
                    <View style={styles.mealImageContainer}>
                      <Image
                        source={{
                          uri:
                            meal.image_url ||
                            'https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=Meal',
                        }}
                        style={styles.mealImage}
                        resizeMode='cover'
                        defaultSource={{
                          uri: 'https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=Meal',
                        }}
                      />
                    </View>
                    <View style={styles.mealInfo}>
                      <ThemedText type='body' style={styles.mealTitle}>
                        {meal.title}
                      </ThemedText>
                      <ThemedText type='caption' style={styles.mealDescription} numberOfLines={2}>
                        {meal.description}
                      </ThemedText>
                      <View style={styles.mealMeta}>
                        <View style={[styles.difficulty, { backgroundColor: meal.category.color }]}>
                          <ThemedText type='caption' style={styles.difficultyText}>
                            {meal.difficulty}
                          </ThemedText>
                        </View>
                        <View style={styles.prepTime}>
                          <IconSymbol size={16} name='clock' color={Colors.dark.muted} />
                          <ThemedText type='caption' style={styles.prepTimeText}>
                            {meal.prep_time}m
                          </ThemedText>
                        </View>
                        {meal.calories_per_serving && (
                          <View style={styles.calories}>
                            <IconSymbol size={16} name='flame' color={Colors.dark.warning} />
                            <ThemedText type='caption' style={styles.caloriesText}>
                              {meal.calories_per_serving} cal
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </ModernCard>
              </TouchableOpacity>
            ))}

            {/* Expanded meal plans view */}
            {showAllMealPlans && (
              <View style={styles.expandedSection}>
                <ThemedText type='body' style={styles.expandedTitle}>
                  All Meal Plans
                </ThemedText>

                {expandedLoading.mealPlans ? (
                  <View style={styles.expandedLoading}>
                    <ActivityIndicator size='large' color={Colors.dark.primary} />
                    <ThemedText type='body' style={styles.expandedLoadingText}>
                      Loading all meal plans...
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.mealGrid}>
                    {contentLists.mealPlans.map(meal => (
                      <TouchableOpacity
                        key={`expanded-${meal.id}`}
                        onPress={() => openMealPlanModal(meal)}
                      >
                        <ModernCard variant='elevated' style={styles.expandedMealCard}>
                          <View style={styles.expandedMealContent}>
                            <View style={styles.expandedMealImageContainer}>
                              <Image
                                source={{
                                  uri:
                                    meal.image_url ||
                                    'https://via.placeholder.com/120x80/4CAF50/FFFFFF?text=Meal',
                                }}
                                style={styles.expandedMealImage}
                                resizeMode='cover'
                              />
                            </View>
                            <View style={styles.expandedMealInfo}>
                              <ThemedText type='body' style={styles.expandedMealTitle}>
                                {meal.title}
                              </ThemedText>
                              <ThemedText
                                type='caption'
                                style={styles.expandedMealDescription}
                                numberOfLines={2}
                              >
                                {meal.description}
                              </ThemedText>
                              <View style={styles.expandedMealMeta}>
                                <View
                                  style={[
                                    styles.difficulty,
                                    { backgroundColor: meal.category.color },
                                  ]}
                                >
                                  <ThemedText type='caption' style={styles.difficultyText}>
                                    {meal.difficulty}
                                  </ThemedText>
                                </View>
                                <View style={styles.prepTime}>
                                  <IconSymbol size={16} name='clock' color={Colors.dark.muted} />
                                  <ThemedText type='caption' style={styles.prepTimeText}>
                                    {meal.prep_time}m
                                  </ThemedText>
                                </View>
                              </View>
                            </View>
                          </View>
                        </ModernCard>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type='heading' style={styles.sectionTitle}>
              Nourishing Meals 🍽️
            </ThemedText>
            <ModernCard variant='elevated' style={styles.placeholderCard}>
              <ThemedText type='body' style={styles.placeholderText}>
                Loading meal plans...
              </ThemedText>
            </ModernCard>
          </View>
        )}

        {/* Featured Articles - Dynamic from API */}
        {homeContent?.featured_articles && homeContent.featured_articles.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type='heading' style={styles.sectionTitle}>
                Wellness Tips 📚
              </ThemedText>
            </View>
            {homeContent.featured_articles.map(article => (
              <TouchableOpacity
                key={article.id}
                onPress={() => openArticleModal(article)}
                activeOpacity={0.8}
              >
                <ModernCard variant='elevated' style={styles.articleCard}>
                  <View style={styles.articleContent}>
                    <View style={styles.articleImageContainer}>
                      <Image
                        source={{
                          uri:
                            article.image_url ||
                            'https://via.placeholder.com/80x80/FF9800/FFFFFF?text=Article',
                        }}
                        style={styles.articleImage}
                        resizeMode='cover'
                        defaultSource={{
                          uri: 'https://via.placeholder.com/80x120/FF9800/FFFFFF?text=Article',
                        }}
                      />
                    </View>
                    <View style={styles.articleInfo}>
                      <ThemedText type='body' style={styles.articleTitle}>
                        {article.title}
                      </ThemedText>
                      <ThemedText type='caption' style={styles.articleExcerpt} numberOfLines={3}>
                        {article.excerpt}
                      </ThemedText>
                      {article.stress_reduction_tips &&
                        article.stress_reduction_tips.length > 0 && (
                          <View style={styles.stressTipsPreview}>
                            <IconSymbol size={14} name='lightbulb' color={Colors.dark.warning} />
                            <ThemedText
                              type='caption'
                              style={styles.stressTipsText}
                              numberOfLines={1}
                            >
                              {article.stress_reduction_tips[0]}
                            </ThemedText>
                          </View>
                        )}
                      <View style={styles.articleMeta}>
                        <View
                          style={[styles.category, { backgroundColor: article.category.color }]}
                        >
                          <ThemedText type='caption' style={styles.categoryText}>
                            {article.category.name}
                          </ThemedText>
                        </View>
                        <View style={styles.readTime}>
                          <IconSymbol size={16} name='clock' color={Colors.dark.muted} />
                          <ThemedText type='caption' style={styles.readTimeText}>
                            {article.read_time}m read
                          </ThemedText>
                        </View>
                        {article.author && (
                          <View style={styles.author}>
                            <IconSymbol size={14} name='person' color={Colors.dark.muted} />
                            <ThemedText type='caption' style={styles.authorText}>
                              {article.author}
                            </ThemedText>
                          </View>
                        )}
                        <View style={styles.clickIndicator}>
                          <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
                        </View>
                      </View>
                    </View>
                  </View>
                </ModernCard>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type='heading' style={styles.sectionTitle}>
              Wellness Tips 📚
            </ThemedText>
            <ModernCard variant='elevated' style={styles.placeholderCard}>
              <ThemedText type='body' style={styles.placeholderText}>
                Loading articles...
              </ThemedText>
            </ModernCard>
          </View>
        )}
      </ScrollView>

      {/* Meal Plan Details Modal */}
      {showMealPlanModal && selectedMealPlan && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='heading' style={styles.modalTitle}>
                {selectedMealPlan.title}
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeMealPlanModal}>
                <IconSymbol size={24} name='xmark' color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {mealPlanModalLoading ? (
                <View style={styles.mealPlanModalLoading}>
                  <ActivityIndicator size='large' color={Colors.dark.primary} />
                  <ThemedText type='body' style={styles.mealPlanModalLoadingText}>
                    Loading meal plan details...
                  </ThemedText>
                </View>
              ) : (
                <>
                  {/* Meal Plan Image */}
                  <View style={styles.mealPlanModalImageContainer}>
                    <Image
                      source={{
                        uri:
                          selectedMealPlan.image_url ||
                          'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Meal+Plan',
                      }}
                      style={styles.mealPlanModalImage}
                      resizeMode='cover'
                    />
                    <View style={styles.mealPlanImageOverlay}>
                      <View
                        style={[
                          styles.mealPlanCategoryBadge,
                          { backgroundColor: selectedMealPlan.category.color },
                        ]}
                      >
                        <ThemedText type='caption' style={styles.mealPlanCategoryBadgeText}>
                          {selectedMealPlan.category.name}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Title & Description */}
                  <View style={styles.mealPlanHeader}>
                    <ThemedText type='title' style={styles.mealPlanTitle}>
                      {selectedMealPlan.title}
                    </ThemedText>
                    <ThemedText type='body' style={styles.mealPlanDescriptionText}>
                      {selectedMealPlan.description}
                    </ThemedText>
                  </View>

                  {/* Compact Info Rows */}
                  <View style={styles.mealPlanInfoSection}>
                    <View style={styles.infoRow}>
                      <ThemedText type='body' style={styles.infoText}>
                        🍳 Difficulty:{' '}
                        {selectedMealPlan.difficulty?.charAt(0).toUpperCase() +
                          selectedMealPlan.difficulty?.slice(1) || 'Easy'}
                      </ThemedText>
                      <ThemedText type='body' style={styles.infoText}>
                        ⏱ {(selectedMealPlan.prep_time || 0) + (selectedMealPlan.cook_time || 0)}{' '}
                        mins
                      </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <ThemedText type='body' style={styles.infoText}>
                        🥗 Servings: {selectedMealPlan.servings || 1}
                      </ThemedText>
                      <ThemedText type='body' style={styles.infoText}>
                        🔥 {selectedMealPlan.calories_per_serving || 0} kcal
                      </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <ThemedText type='body' style={styles.infoText}>
                        💪 {selectedMealPlan.protein || 0}g Protein
                      </ThemedText>
                      <ThemedText type='body' style={styles.infoText}>
                        🍞 {selectedMealPlan.carbs || 0}g Carbs
                      </ThemedText>
                      <ThemedText type='body' style={styles.infoText}>
                        🧈 {selectedMealPlan.fat || 0}g Fat
                      </ThemedText>
                    </View>
                  </View>

                  {/* Stress Reduction Benefits */}
                  {selectedMealPlan.stress_reduction_benefits &&
                    selectedMealPlan.stress_reduction_benefits.length > 0 && (
                      <View style={styles.mealPlanSection}>
                        <ThemedText type='body' style={styles.sectionTitle}>
                          🌿 Stress Reduction Benefits
                        </ThemedText>
                        {selectedMealPlan.stress_reduction_benefits.map((benefit, index) => (
                          <ThemedText key={index} type='body' style={styles.listItem}>
                            • {benefit}
                          </ThemedText>
                        ))}
                      </View>
                    )}

                  {/* Mood Boost Ingredients */}
                  {selectedMealPlan.mood_boost_ingredients &&
                    selectedMealPlan.mood_boost_ingredients.length > 0 && (
                      <View style={styles.mealPlanSection}>
                        <ThemedText type='body' style={styles.sectionTitle}>
                          😊 Mood Boost Ingredients
                        </ThemedText>
                        {selectedMealPlan.mood_boost_ingredients.map((ingredient, index) => (
                          <ThemedText key={index} type='body' style={styles.listItem}>
                            • {ingredient}
                          </ThemedText>
                        ))}
                      </View>
                    )}

                  {/* Ingredients */}
                  <View style={styles.mealPlanSection}>
                    <ThemedText type='body' style={styles.sectionTitle}>
                      🛒 Ingredients
                    </ThemedText>
                    {selectedMealPlan.ingredients && selectedMealPlan.ingredients.length > 0 ? (
                      selectedMealPlan.ingredients.map((ingredient, index) => (
                        <ThemedText key={index} type='body' style={styles.listItem}>
                          • {ingredient}
                        </ThemedText>
                      ))
                    ) : (
                      <ThemedText type='body' style={styles.noDataText}>
                        No ingredients available
                      </ThemedText>
                    )}
                  </View>

                  {/* Instructions */}
                  <View style={styles.mealPlanSection}>
                    <ThemedText type='body' style={styles.sectionTitle}>
                      👨‍🍳 Instructions
                    </ThemedText>
                    {selectedMealPlan.instructions && selectedMealPlan.instructions.length > 0 ? (
                      selectedMealPlan.instructions.map((instruction, index) => (
                        <ThemedText key={index} type='body' style={styles.listItem}>
                          {index + 1}. {instruction}
                        </ThemedText>
                      ))
                    ) : (
                      <ThemedText type='body' style={styles.noDataText}>
                        No instructions available
                      </ThemedText>
                    )}
                  </View>

                  {/* Tips */}
                  {selectedMealPlan.tips && (
                    <View style={styles.mealPlanSection}>
                      <ThemedText type='body' style={styles.sectionTitle}>
                        💡 Tips
                      </ThemedText>
                      <ThemedText type='body' style={styles.tipsText}>
                        {selectedMealPlan.tips}
                      </ThemedText>
                    </View>
                  )}

                  {/* Creation Date */}
                  {selectedMealPlan.created_at && (
                    <View style={styles.mealPlanSection}>
                      <View style={styles.creationDateContainer}>
                        <IconSymbol size={16} name='calendar' color={Colors.dark.muted} />
                        <ThemedText type='caption' style={styles.creationDateText}>
                          Created: {new Date(selectedMealPlan.created_at).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={closeMealPlanModal}>
                <ThemedText style={styles.modalButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && selectedDocument && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='heading' style={styles.modalTitle}>
                {selectedDocument.filename}
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeDocumentViewer}>
                <IconSymbol size={24} name='xmark' color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.documentDetails}>
                <View style={styles.detailRow}>
                  <ThemedText type='caption' style={styles.detailLabel}>
                    Category:
                  </ThemedText>
                  <ThemedText type='body' style={styles.detailValue}>
                    {selectedDocument.category}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type='caption' style={styles.detailLabel}>
                    Size:
                  </ThemedText>
                  <ThemedText type='body' style={styles.detailValue}>
                    {Math.round(selectedDocument.fileSize / 1024)}KB
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type='caption' style={styles.detailLabel}>
                    Uploaded:
                  </ThemedText>
                  <ThemedText type='body' style={styles.detailValue}>
                    {new Date(selectedDocument.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>

              {selectedDocument.content && (
                <View style={styles.contentSection}>
                  <ThemedText type='heading' style={styles.contentTitle}>
                    Content
                  </ThemedText>
                  <ThemedText type='body' style={styles.contentText}>
                    {selectedDocument.content}
                  </ThemedText>
                </View>
              )}

              {selectedDocument.summary && (
                <View style={styles.contentSection}>
                  <ThemedText type='heading' style={styles.contentTitle}>
                    Summary
                  </ThemedText>
                  <ThemedText type='body' style={styles.summaryText}>
                    {selectedDocument.summary}
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={closeDocumentViewer}>
                <ThemedText style={styles.modalButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Progress Tracking Modal */}
      {showProgressModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='heading' style={styles.modalTitle}>
                Update Your Progress
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeProgressModal}>
                <IconSymbol size={24} name='xmark' color={Colors.dark.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Mood Rating */}
              <View style={styles.formSection}>
                <ThemedText type='body' style={styles.formLabel}>
                  How's your mood today? {getMoodEmoji(progressForm.mood_rating)}
                </ThemedText>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        progressForm.mood_rating === rating && styles.ratingButtonActive,
                      ]}
                      onPress={() => handleProgressChange('mood_rating', rating)}
                    >
                      <ThemedText
                        style={[
                          styles.ratingText,
                          progressForm.mood_rating === rating && styles.ratingTextActive,
                        ]}
                      >
                        {rating}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                <ThemedText type='caption' style={styles.ratingHint}>
                  1 = Very Poor, 10 = Excellent
                </ThemedText>
              </View>

              {/* Stress Level */}
              <View style={styles.formSection}>
                <ThemedText type='body' style={styles.formLabel}>
                  Stress Level: {progressForm.stress_level}/10
                </ThemedText>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity
                    style={styles.sliderTrack}
                    onPress={e => {
                      // Simple slider implementation
                      const { locationX } = e.nativeEvent;
                      const percentage = Math.max(0, Math.min(1, locationX / 200));
                      const value = Math.round(percentage * 10);
                      handleProgressChange('stress_level', value);
                    }}
                  >
                    <View style={styles.sliderFill}>
                      <View
                        style={[
                          styles.sliderThumb,
                          { left: `${(progressForm.stress_level / 10) * 100}%` },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
                <ThemedText type='caption' style={styles.ratingHint}>
                  Low (1-3) • Medium (4-7) • High (8-10)
                </ThemedText>
              </View>

              {/* Sleep Hours */}
              <View style={styles.formSection}>
                <ThemedText type='body' style={styles.formLabel}>
                  How many hours did you sleep? 💤
                </ThemedText>
                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      handleProgressChange(
                        'sleep_hours',
                        Math.max(0, progressForm.sleep_hours - 0.5)
                      )
                    }
                  >
                    <IconSymbol size={20} name='minus' color={Colors.dark.primary} />
                  </TouchableOpacity>
                  <View style={styles.numberDisplay}>
                    <ThemedText type='title' style={styles.numberValue}>
                      {progressForm.sleep_hours}
                    </ThemedText>
                    <ThemedText type='caption' style={styles.numberUnit}>
                      hours
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      handleProgressChange(
                        'sleep_hours',
                        Math.min(24, progressForm.sleep_hours + 0.5)
                      )
                    }
                  >
                    <IconSymbol size={20} name='plus' color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Exercise Minutes */}
              <View style={styles.formSection}>
                <ThemedText type='body' style={styles.formLabel}>
                  Exercise minutes today 🏃‍♂️
                </ThemedText>
                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      handleProgressChange(
                        'exercise_minutes',
                        Math.max(0, progressForm.exercise_minutes - 5)
                      )
                    }
                  >
                    <IconSymbol size={20} name='minus' color={Colors.dark.primary} />
                  </TouchableOpacity>
                  <View style={styles.numberDisplay}>
                    <ThemedText type='title' style={styles.numberValue}>
                      {progressForm.exercise_minutes}
                    </ThemedText>
                    <ThemedText type='caption' style={styles.numberUnit}>
                      minutes
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      handleProgressChange('exercise_minutes', progressForm.exercise_minutes + 5)
                    }
                  >
                    <IconSymbol size={20} name='plus' color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meditation Minutes */}
              <View style={styles.formSection}>
                <ThemedText type='body' style={styles.formLabel}>
                  Meditation minutes today 🧘‍♀️
                </ThemedText>
                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      handleProgressChange(
                        'meditation_minutes',
                        Math.max(0, progressForm.meditation_minutes - 5)
                      )
                    }
                  >
                    <IconSymbol size={20} name='minus' color={Colors.dark.primary} />
                  </TouchableOpacity>
                  <View style={styles.numberDisplay}>
                    <ThemedText type='title' style={styles.numberValue}>
                      {progressForm.meditation_minutes}
                    </ThemedText>
                    <ThemedText type='caption' style={styles.numberUnit}>
                      minutes
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      handleProgressChange(
                        'meditation_minutes',
                        progressForm.meditation_minutes + 5
                      )
                    }
                  >
                    <IconSymbol size={20} name='plus' color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formSection}>
                <ThemedText type='body' style={styles.formLabel}>
                  Any notes for today? 📝
                </ThemedText>
                <View style={styles.notesContainer}>
                  <TextInput
                    style={styles.notesInput}
                    onChangeText={text => handleProgressChange('notes', text)}
                    placeholder='How are you feeling? Any achievements or challenges?'
                    placeholderTextColor={Colors.dark.muted}
                    multiline
                    numberOfLines={3}
                    value={progressForm.notes}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.progressModalButton, styles.progressModalButtonSecondary]}
                onPress={closeProgressModal}
              >
                <ThemedText style={styles.progressModalButtonSecondaryText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.progressModalButton, styles.progressModalButtonPrimary]}
                onPress={updateProgress}
                disabled={progressSubmitting}
              >
                {progressSubmitting ? (
                  <ActivityIndicator size='small' color={Colors.dark.background} />
                ) : (
                  <ThemedText style={styles.progressModalButtonPrimaryText}>
                    Save Progress
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Wellness Tip Modal */}
      {showWellnessTipModal && selectedWellnessTip && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='heading' style={styles.modalTitle}>
                Wellness Tip Details
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeWellnessTipModal}>
                <IconSymbol size={24} name='xmark' color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Article Info */}
              <View style={styles.wellnessTipModalHeader}>
                <View style={styles.wellnessTipModalIcon}>
                  <IconSymbol size={32} name='lightbulb.fill' color={Colors.dark.warning} />
                </View>
                <View style={styles.wellnessTipModalInfo}>
                  <ThemedText type='title' style={styles.wellnessTipModalTitle}>
                    {selectedWellnessTip.title}
                  </ThemedText>
                  {selectedWellnessTip.author && (
                    <ThemedText type='caption' style={styles.wellnessTipModalAuthor}>
                      by {selectedWellnessTip.author}
                    </ThemedText>
                  )}
                  <View
                    style={[
                      styles.category,
                      { backgroundColor: selectedWellnessTip.category.color },
                    ]}
                  >
                    <ThemedText type='caption' style={styles.categoryText}>
                      {selectedWellnessTip.category.name}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Article Excerpt */}
              <View style={styles.wellnessTipSection}>
                <ThemedText type='body' style={styles.wellnessTipExcerpt}>
                  {selectedWellnessTip.excerpt}
                </ThemedText>
              </View>

              {/* Stress Reduction Tips */}
              {selectedWellnessTip.stress_reduction_tips &&
                selectedWellnessTip.stress_reduction_tips.length > 0 && (
                  <View style={styles.wellnessTipSection}>
                    <ThemedText type='body' style={styles.sectionTitle}>
                      🌿 Stress Reduction Tips
                    </ThemedText>
                    {selectedWellnessTip.stress_reduction_tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <View style={styles.tipBullet}>
                          <ThemedText style={styles.tipBulletText}>💡</ThemedText>
                        </View>
                        <ThemedText type='body' style={styles.tipText}>
                          {tip}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}

              {/* Practical Exercises */}
              {selectedWellnessTip.practical_exercises &&
                selectedWellnessTip.practical_exercises.length > 0 && (
                  <View style={styles.wellnessTipSection}>
                    <ThemedText type='body' style={styles.sectionTitle}>
                      🏃‍♀️ Practical Exercises
                    </ThemedText>
                    {selectedWellnessTip.practical_exercises.map((exercise, index) => (
                      <View key={index} style={styles.tipItem}>
                        <View style={styles.tipBullet}>
                          <ThemedText style={styles.tipBulletText}>✨</ThemedText>
                        </View>
                        <ThemedText type='body' style={styles.tipText}>
                          {exercise}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}

              {/* Tags */}
              {selectedWellnessTip.tags && selectedWellnessTip.tags.length > 0 && (
                <View style={styles.wellnessTipSection}>
                  <ThemedText type='body' style={styles.sectionTitle}>
                    🏷️ Related Topics
                  </ThemedText>
                  <View style={styles.tagsContainer}>
                    {selectedWellnessTip.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText type='caption' style={styles.tagText}>
                          {tag}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Read Time */}
              <View style={styles.wellnessTipModalFooter}>
                <View style={styles.readTimeContainer}>
                  <IconSymbol size={16} name='clock' color={Colors.dark.muted} />
                  <ThemedText type='caption' style={styles.readTimeText}>
                    {selectedWellnessTip.read_time} minute read
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={closeWellnessTipModal}>
                <ThemedText style={styles.modalButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Article Details Modal */}
      {showArticleModal && selectedArticle && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='heading' style={styles.modalTitle}>
                Article Details
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeArticleModal}>
                <IconSymbol size={24} name='xmark' color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {articleModalLoading ? (
                <View style={styles.articleModalLoading}>
                  <ActivityIndicator size='large' color={Colors.dark.primary} />
                  <ThemedText type='body' style={styles.articleModalLoadingText}>
                    Loading article details...
                  </ThemedText>
                </View>
              ) : (
                <>
                  {/* Article Header */}
                  <View style={styles.articleModalHeader}>
                    <View style={styles.articleModalImageContainer}>
                      <Image
                        source={{
                          uri:
                            selectedArticle.image_url ||
                            'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Article',
                        }}
                        style={styles.articleModalImage}
                        resizeMode='cover'
                      />
                      <View style={styles.articleImageOverlay}>
                        <View
                          style={[
                            styles.articleCategoryBadge,
                            { backgroundColor: selectedArticle.category.color },
                          ]}
                        >
                          <ThemedText type='caption' style={styles.categoryText}>
                            {selectedArticle.category.name}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <View style={styles.articleModalInfo}>
                      <ThemedText type='title' style={styles.articleModalTitle}>
                        {selectedArticle.title}
                      </ThemedText>

                      <View style={styles.articleModalMeta}>
                        {selectedArticle.author && (
                          <View style={styles.articleAuthorInfo}>
                            <IconSymbol size={16} name='person.fill' color={Colors.dark.primary} />
                            <ThemedText type='body' style={styles.articleAuthorName}>
                              {selectedArticle.author}
                            </ThemedText>
                          </View>
                        )}

                        <View style={styles.articleReadTime}>
                          <IconSymbol size={16} name='clock' color={Colors.dark.muted} />
                          <ThemedText type='caption' style={styles.readTimeText}>
                            {selectedArticle.read_time} minute read
                          </ThemedText>
                        </View>

                        {selectedArticle.created_at && (
                          <View style={styles.articleDate}>
                            <IconSymbol size={16} name='calendar' color={Colors.dark.muted} />
                            <ThemedText type='caption' style={styles.articleDateText}>
                              {new Date(selectedArticle.created_at).toLocaleDateString()}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Article Content */}
                  <View style={styles.articleSection}>
                    <ThemedText type='body' style={styles.articleModalContent}>
                      {selectedArticle.content || selectedArticle.excerpt}
                    </ThemedText>
                  </View>

                  {/* Author Bio */}
                  {selectedArticle.author_bio && (
                    <View style={styles.articleSection}>
                      <ThemedText type='body' style={styles.sectionTitle}>
                        👤 About the Author
                      </ThemedText>
                      <ThemedText type='body' style={styles.authorBio}>
                        {selectedArticle.author_bio}
                      </ThemedText>
                    </View>
                  )}

                  {/* Stress Reduction Tips */}
                  {selectedArticle.stress_reduction_tips &&
                    selectedArticle.stress_reduction_tips.length > 0 && (
                      <View style={styles.articleSection}>
                        <ThemedText type='body' style={styles.sectionTitle}>
                          🌿 Stress Reduction Tips
                        </ThemedText>
                        {selectedArticle.stress_reduction_tips.map((tip, index) => (
                          <View key={index} style={styles.tipItem}>
                            <View style={styles.tipBullet}>
                              <ThemedText style={styles.tipBulletText}>💡</ThemedText>
                            </View>
                            <ThemedText type='body' style={styles.tipText}>
                              {tip}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Practical Exercises */}
                  {selectedArticle.practical_exercises &&
                    selectedArticle.practical_exercises.length > 0 && (
                      <View style={styles.articleSection}>
                        <ThemedText type='body' style={styles.sectionTitle}>
                          🏃‍♀️ Practical Exercises
                        </ThemedText>
                        {selectedArticle.practical_exercises.map((exercise, index) => (
                          <View key={index} style={styles.tipItem}>
                            <View style={styles.tipBullet}>
                              <ThemedText style={styles.tipBulletText}>✨</ThemedText>
                            </View>
                            <ThemedText type='body' style={styles.tipText}>
                              {exercise}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Tags */}
                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <View style={styles.articleSection}>
                      <ThemedText type='body' style={styles.sectionTitle}>
                        🏷️ Related Topics
                      </ThemedText>
                      <View style={styles.tagsContainer}>
                        {selectedArticle.tags.map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <ThemedText type='caption' style={styles.tagText}>
                              {tag}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Video Link */}
                  {selectedArticle.video_url && (
                    <View style={styles.articleSection}>
                      <ThemedText type='body' style={styles.sectionTitle}>
                        🎥 Related Video
                      </ThemedText>
                      <TouchableOpacity style={styles.videoLink}>
                        <IconSymbol size={20} name='play.circle.fill' color={Colors.dark.primary} />
                        <ThemedText type='body' style={styles.videoLinkText}>
                          Watch Related Video
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.dark.text,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  welcomeHeader: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.large,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  welcomeText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  welcomeTitle: {
    color: Colors.dark.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: Colors.dark.background,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  errorCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.danger,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  quoteCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  quoteContent: {
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: Spacing.md,
    lineHeight: 26,
  },
  quoteAuthor: {
    opacity: 0.7,
    textAlign: 'center',
  },
  wellnessTipCard: {
    marginBottom: Spacing.lg,
  },
  wellnessTipContent: {
    padding: Spacing.md,
  },
  wellnessTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  wellnessTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  wellnessTipText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  wellnessTipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wellnessTipSource: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
  },
  wellnessTipAuthor: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },

  // Wellness tip modal styles
  wellnessTipModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  wellnessTipModalIcon: {
    marginRight: Spacing.md,
    marginTop: Spacing.xs,
  },
  wellnessTipModalInfo: {
    flex: 1,
  },
  wellnessTipModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  wellnessTipModalAuthor: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  wellnessTipSection: {
    marginBottom: Spacing.lg,
  },
  wellnessTipExcerpt: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  tipBullet: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  tipBulletText: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tagText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  wellnessTipModalFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.muted + '20',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Article modal styles
  articleModalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  articleModalLoadingText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  articleModalHeader: {
    marginBottom: Spacing.lg,
  },
  articleModalImageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  articleModalImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  articleImageOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  articleCategoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  articleModalInfo: {
    marginBottom: Spacing.md,
  },
  articleModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    lineHeight: 28,
    textAlign: 'center',
  },
  articleModalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  articleAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleAuthorName: {
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  articleReadTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleDateText: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  articleSection: {
    marginBottom: Spacing.lg,
  },
  articleModalContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  authorBio: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.9,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  videoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  videoLinkText: {
    marginLeft: Spacing.sm,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  clickIndicator: {
    marginLeft: 'auto',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  wellnessCard: {
    padding: Spacing.lg,
  },
  wellnessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wellnessItem: {
    alignItems: 'center',
    flex: 1,
  },
  wellnessLabel: {
    marginTop: Spacing.xs,
    opacity: 0.7,
    textAlign: 'center',
  },
  wellnessValue: {
    marginTop: Spacing.xs,
    fontSize: 18,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingRight: Spacing.lg,
  },
  videoCard: {
    width: width * 0.7,
    marginRight: Spacing.md,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  videoThumbnail: {
    position: 'relative',
    height: 120,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: Colors.dark.background,
    fontSize: 12,
  },
  videoInfo: {
    padding: Spacing.md,
  },
  videoTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stressLevel: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  stressLevelText: {
    color: Colors.dark.background,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  moodBoost: {
    opacity: 0.7,
    fontSize: 12,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealContent: {
    flexDirection: 'row',
  },
  mealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mealTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  mealDescription: {
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficulty: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  difficultyText: {
    color: Colors.dark.background,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  prepTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prepTimeText: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
    fontSize: 12,
  },
  calories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesText: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
    fontSize: 12,
  },
  articleCard: {
    marginBottom: Spacing.md,
  },
  articleContent: {
    flexDirection: 'row',
  },
  articleImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  articleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  articleTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  articleExcerpt: {
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  categoryText: {
    color: Colors.dark.background,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
    fontSize: 12,
  },
  stressTipsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  stressTipsText: {
    marginLeft: Spacing.xs,
    opacity: 0.8,
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flex: 1,
    marginHorizontal: Spacing.xs,
    ...Shadows.small,
  },
  actionText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontSize: 12,
  },
  placeholderCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  placeholderText: {
    opacity: 0.6,
    textAlign: 'center',
  },

  // New styles for enhanced functionality
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.sm,
    ...Shadows.small,
  },
  viewAllButtonText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  documentCard: {
    marginBottom: Spacing.md,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  documentMeta: {
    opacity: 0.7,
    fontSize: 12,
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.muted + '30',
  },
  modalTitle: {
    flex: 1,
    marginRight: Spacing.md,
    textAlign: 'center',
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.muted + '20',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  documentDetails: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.muted + '20',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.muted + '20',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    opacity: 0.7,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.dark.primary,
    textAlign: 'center',
  },
  detailValue: {
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
    color: Colors.dark.text,
  },
  contentSection: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.background + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  contentTitle: {
    marginBottom: Spacing.md,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    textAlign: 'center',
  },
  contentText: {
    lineHeight: 24,
    opacity: 0.9,
    fontSize: 15,
    textAlign: 'justify',
    backgroundColor: Colors.dark.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  summaryText: {
    lineHeight: 22,
    opacity: 0.8,
    fontStyle: 'italic',
    fontSize: 15,
    textAlign: 'center',
    backgroundColor: Colors.dark.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary + '30',
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.muted + '30',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 120,
  },
  modalButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Meal Plan Modal styles
  mealPlanModalImageContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  mealPlanModalImage: {
    width: '100%',
    height: 200,
  },
  mealPlanImageOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  mealPlanCategoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    ...Shadows.small,
  },
  mealPlanCategoryBadgeText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 12,
  },

  mealPlanDescriptionText: {
    lineHeight: 20,
    opacity: 0.8,
    color: Colors.dark.muted,
    textAlign: 'center',
  },
  mealPlanSection: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  mealPlanSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.primary + '10',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  mealPlanSectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tipsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.dark.muted,
    marginTop: Spacing.xs,
    lineHeight: 20,
    textAlign: 'center',
  },
  creationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.dark.muted + '10',
    borderRadius: BorderRadius.sm,
  },
  creationDateText: {
    opacity: 0.7,
    fontSize: 12,
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
    padding: Spacing.lg,
  },
  mealPlanModalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
    minHeight: 200,
  },
  mealPlanModalLoadingText: {
    marginTop: Spacing.md,
    opacity: 0.7,
    textAlign: 'center',
  },
  mealPlanHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  mealPlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  mealPlanInfoSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },

  listItem: {
    fontSize: 14,
    color: Colors.dark.text,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Expanded section styles
  expandedSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.muted + '20',
  },
  expandedTitle: {
    marginBottom: Spacing.md,
    opacity: 0.8,
    textAlign: 'center',
  },
  expandedLoading: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  expandedLoadingText: {
    marginTop: Spacing.md,
    opacity: 0.7,
    textAlign: 'center',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expandedVideoCard: {
    width: (width - Spacing.lg * 3) / 2,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  expandedVideoThumbnail: {
    position: 'relative',
    height: 80,
  },
  expandedThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  expandedVideoInfo: {
    padding: Spacing.sm,
  },
  expandedVideoTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  expandedVideoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Expanded meal plan styles
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expandedMealCard: {
    width: (width - Spacing.lg * 3) / 2,
    marginBottom: Spacing.md,
  },
  expandedMealContent: {
    flexDirection: 'column',
  },
  expandedMealImageContainer: {
    width: '100%',
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  expandedMealImage: {
    width: '100%',
    height: '100%',
  },
  expandedMealInfo: {
    padding: Spacing.sm,
  },
  expandedMealTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  expandedMealDescription: {
    opacity: 0.7,
    marginBottom: Spacing.sm,
    fontSize: 10,
  },
  expandedMealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Expanded article styles
  articleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expandedArticleCard: {
    width: (width - Spacing.lg * 3) / 2,
    marginBottom: Spacing.md,
  },
  expandedArticleContent: {
    flexDirection: 'column',
  },
  expandedArticleImageContainer: {
    width: '100%',
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  expandedArticleImage: {
    width: '100%',
    height: '100%',
  },
  expandedArticleInfo: {
    padding: Spacing.sm,
  },
  expandedArticleTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  expandedArticleExcerpt: {
    opacity: 0.7,
    marginBottom: Spacing.sm,
    fontSize: 10,
  },
  expandedArticleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Load More Button styles
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + '40',
  },
  loadMoreButtonText: {
    color: Colors.dark.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },

  // Progress tracking styles
  wellnessActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.dark.warning + '20',
    borderRadius: BorderRadius.sm,
  },
  streakText: {
    color: Colors.dark.warning,
    fontWeight: '600',
    fontSize: 12,
  },
  historyButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.secondary + '20',
  },
  updateProgressButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.primary + '20',
  },
  progressSummary: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.muted + '20',
    alignItems: 'center',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressStatText: {
    opacity: 0.8,
    fontSize: 11,
  },
  progressSummaryText: {
    opacity: 0.7,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Document actions styles
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.primary + '20',
    marginRight: Spacing.sm,
  },

  // Progress tracking modal styles (removed duplicates)
  progressModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressModalButtonPrimary: {
    backgroundColor: Colors.dark.primary,
  },
  progressModalButtonSecondary: {
    backgroundColor: Colors.dark.muted + '20',
    borderWidth: 1,
    borderColor: Colors.dark.muted + '40',
  },
  progressModalButtonPrimaryText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  progressModalButtonSecondaryText: {
    color: Colors.dark.text,
    fontWeight: '600',
  },

  // Form styles
  formSection: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.muted + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.muted + '40',
  },
  ratingButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  ratingTextActive: {
    color: Colors.dark.background,
  },
  ratingHint: {
    opacity: 0.7,
    textAlign: 'center',
    fontSize: 12,
  },

  // Slider styles
  sliderContainer: {
    marginBottom: Spacing.xs,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.dark.muted + '20',
    borderRadius: BorderRadius.sm,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary + '40',
    borderRadius: BorderRadius.sm,
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },

  // Number input styles
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary + '40',
  },
  numberDisplay: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    minWidth: 80,
  },
  numberValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  numberUnit: {
    opacity: 0.7,
    fontSize: 12,
  },

  // Notes styles
  notesContainer: {
    borderWidth: 1,
    borderColor: Colors.dark.muted + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    backgroundColor: Colors.dark.muted + '10',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    color: Colors.dark.text,
  },

  // Progress history styles
  historyLoading: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  historyLoadingText: {
    marginTop: Spacing.md,
    opacity: 0.7,
  },
  historyEntry: {
    backgroundColor: Colors.dark.muted + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.muted + '20',
  },
  historyDate: {
    marginBottom: Spacing.sm,
  },
  historyDateText: {
    fontWeight: '600',
    fontSize: 16,
  },
  historyMetrics: {
    gap: Spacing.sm,
  },
  historyMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyMetricText: {
    opacity: 0.8,
  },
  historyEmpty: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  historyEmptyText: {
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  historyEmptySubtext: {
    marginTop: Spacing.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
});
