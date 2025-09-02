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
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { apiService } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface HomeContent {
  featured_videos: Array<{
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
  }>;
  featured_meal_plans: Array<{
    id: number;
    title: string;
    description: string;
    difficulty: string;
    prep_time: number;
    image_url: string;
    category: {
      id: number;
      name: string;
      color: string;
    };
  }>;
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
  featured_articles: Array<{
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
  }>;
  user_progress: {
    mood_rating: number | null;
    stress_level: number | null;
    sleep_hours: number | null;
    exercise_minutes: number | null;
    meditation_minutes: number | null;
  } | null;
}

export default function HomeScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for enhanced functionality
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [showAllMealPlans, setShowAllMealPlans] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Progress tracking state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [progressForm, setProgressForm] = useState({
    mood_rating: 5,
    stress_level: 5,
    sleep_hours: 7,
    exercise_minutes: 30,
    meditation_minutes: 15,
    notes: ''
  });
  const [progressSubmitting, setProgressSubmitting] = useState(false);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    fetchUserDocuments();
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

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return Colors.dark.success;
    if (level <= 6) return Colors.dark.warning;
    return Colors.dark.danger;
  };

  const fetchUserDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await apiService.request('/documents/list');
      setUserDocuments(response.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      // Don't show error for documents, just log it
    } finally {
      setDocumentsLoading(false);
    }
  };

  const openDocument = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  const closeDocumentViewer = () => {
    setShowDocumentViewer(false);
    setSelectedDocument(null);
  };

  // Progress tracking functions
  const openProgressModal = () => {
    // Pre-fill with current progress if available
    if (homeContent?.user_progress) {
      setProgressForm({
        mood_rating: homeContent.user_progress.mood_rating || 5,
        stress_level: homeContent.user_progress.stress_level || 5,
        sleep_hours: homeContent.user_progress.sleep_hours || 7,
        exercise_minutes: homeContent.user_progress.exercise_minutes || 30,
        meditation_minutes: homeContent.user_progress.meditation_minutes || 15,
        notes: homeContent.user_progress.notes || ''
      });
    }
    setShowProgressModal(true);
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setProgressForm({
      mood_rating: 5,
      stress_level: 5,
      sleep_hours: 7,
      exercise_minutes: 30,
      meditation_minutes: 15,
      notes: ''
    });
  };

  const updateProgress = async () => {
    try {
      setProgressSubmitting(true);

      // Use the public progress endpoint
      const response = await apiService.request('/content/progress/public', {
        method: 'POST',
        body: JSON.stringify(progressForm)
      });

      console.log('Progress updated:', response);

      // Update local state with the response data
      if (homeContent && response.progress) {
        const updatedContent = {
          ...homeContent,
          user_progress: {
            ...homeContent.user_progress,
            ...response.progress
          }
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
      [field]: value
    }));
  };

  const fetchProgressHistory = async () => {
    try {
      setHistoryLoading(true);
      // For now, we'll simulate progress history
      // In a real app, you'd call a backend endpoint
      const mockHistory = [
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mood_rating: 8,
          stress_level: 3,
          sleep_hours: 7.5,
          exercise_minutes: 45,
          meditation_minutes: 20
        },
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mood_rating: 6,
          stress_level: 5,
          sleep_hours: 6.5,
          exercise_minutes: 30,
          meditation_minutes: 15
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mood_rating: 9,
          stress_level: 2,
          sleep_hours: 8.0,
          exercise_minutes: 60,
          meditation_minutes: 30
        }
      ];
      setProgressHistory(mockHistory);
    } catch (err) {
      console.error('Failed to fetch progress history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMoreContent = async (contentType: 'videos' | 'articles' | 'mealPlans') => {
    try {
      let endpoint = '';
      let limit = 5;

      switch (contentType) {
        case 'videos':
          endpoint = `/content/videos/public?limit=${limit}&featured=true`;
          break;
        case 'articles':
          endpoint = `/content/articles/public?limit=${limit}&featured=true`;
          break;
        case 'mealPlans':
          endpoint = `/content/meal-plans/public?limit=${limit}&featured=true`;
          break;
      }

      if (endpoint) {
        const response = await apiService.request(endpoint);
        console.log(`Loaded more ${contentType}:`, response);

        // Update the home content with new items
        if (response && homeContent) {
          const newContent = { ...homeContent };

          switch (contentType) {
            case 'videos':
              if (response.videos) {
                // Filter out duplicates and add new videos
                const existingIds = new Set(homeContent.featured_videos.map(v => v.id));
                const newVideos = response.videos.filter(v => !existingIds.has(v.id));
                newContent.featured_videos = [...homeContent.featured_videos, ...newVideos];
              }
              break;
            case 'articles':
              if (response.articles) {
                const existingIds = new Set(homeContent.featured_articles.map(a => a.id));
                const newArticles = response.articles.filter(a => !existingIds.has(a.id));
                newContent.featured_articles = [...homeContent.featured_articles, ...newArticles];
              }
              break;
            case 'mealPlans':
              if (response.meal_plans) {
                const existingIds = new Set(homeContent.featured_meal_plans.map(m => m.id));
                const newMeals = response.meal_plans.filter(m => !existingIds.has(m.id));
                newContent.featured_meal_plans = [...homeContent.featured_meal_plans, ...newMeals];
              }
              break;
          }

          setHomeContent(newContent);
        }
      }
    } catch (err) {
      console.error(`Failed to load more ${contentType}:`, err);
      Alert.alert('Error', `Failed to load more ${contentType}`);
    }
  };

  if (loading && !homeContent) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <ThemedText style={styles.loadingText}>Loading your wellness content...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <LinearGradient
          colors={[Colors.dark.primary, Colors.dark.secondary]}
          style={styles.welcomeHeader}
        >
          <View style={styles.welcomeContent}>
            <IconSymbol size={40} name="heart.fill" color={Colors.dark.background} />
            <View style={styles.welcomeText}>
              <ThemedText type="title" style={styles.welcomeTitle}>
                Welcome back, {user?.name?.split(' ')[0] || 'Friend'}! 🌟
              </ThemedText>
              <ThemedText type="body" style={styles.welcomeSubtitle}>
                Let's make today a peaceful one
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {error && (
          <ModernCard variant="outlined" style={styles.errorCard}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchHomeContent}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ModernCard>
        )}

        {/* Daily Quote - Dynamic from API */}
        {homeContent?.daily_quote ? (
          <ModernCard variant="elevated" style={styles.quoteCard}>
            <View style={styles.quoteContent}>
              <IconSymbol size={24} name="quote.bubble.fill" color={Colors.dark.primary} />
              <ThemedText type="body" style={styles.quoteText}>
                "{homeContent.daily_quote.text}"
              </ThemedText>
              <ThemedText type="caption" style={styles.quoteAuthor}>
                — {homeContent.daily_quote.author}
              </ThemedText>
            </View>
          </ModernCard>
        ) : (
          <ModernCard variant="elevated" style={styles.quoteCard}>
            <View style={styles.quoteContent}>
              <IconSymbol size={24} name="quote.bubble.fill" color={Colors.dark.primary} />
              <ThemedText type="body" style={styles.quoteText}>
                "Peace comes from within. Do not seek it without."
              </ThemedText>
              <ThemedText type="caption" style={styles.quoteAuthor}>
                — Buddha
              </ThemedText>
            </View>
          </ModernCard>
        )}

        {/* Quick Wellness Check */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              How are you feeling today?
            </ThemedText>
            <View style={styles.wellnessActions}>
              <View style={styles.streakIndicator}>
                <IconSymbol size={16} name="flame.fill" color={Colors.dark.warning} />
                <ThemedText type="caption" style={styles.streakText}>
                  {homeContent?.user_progress ? '3' : '0'} day streak
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => {
                  fetchProgressHistory();
                  setShowProgressHistory(true);
                }}
              >
                <IconSymbol size={16} name="chart.line.uptrend.xyaxis" color={Colors.dark.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.updateProgressButton}
                onPress={openProgressModal}
              >
                <IconSymbol size={16} name="plus.circle" color={Colors.dark.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <ModernCard variant="elevated" style={styles.wellnessCard}>
            <View style={styles.wellnessGrid}>
              <TouchableOpacity style={styles.wellnessItem}>
                <IconSymbol size={32} name="heart.fill" color={Colors.dark.success} />
                <ThemedText type="caption" style={styles.wellnessLabel}>Mood</ThemedText>
                <ThemedText type="body" style={styles.wellnessValue}>
                  {homeContent?.user_progress?.mood_rating
                    ? getMoodEmoji(homeContent.user_progress.mood_rating)
                    : '—'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.wellnessItem}>
                <IconSymbol size={32} name="brain.head.profile" color={getStressLevelColor(homeContent?.user_progress?.stress_level || 5)} />
                <ThemedText type="caption" style={styles.wellnessLabel}>Stress</ThemedText>
                <ThemedText type="body" style={styles.wellnessValue}>
                  {homeContent?.user_progress?.stress_level || '—'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.wellnessItem}>
                <IconSymbol size={32} name="bed.double.fill" color={Colors.dark.primary} />
                <ThemedText type="caption" style={styles.wellnessLabel}>Sleep</ThemedText>
                <ThemedText type="body" style={styles.wellnessValue}>
                  {homeContent?.user_progress?.sleep_hours
                    ? `${homeContent.user_progress.sleep_hours}h`
                    : '—'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.wellnessItem}>
                <IconSymbol size={32} name="figure.walk" color={Colors.dark.warning} />
                <ThemedText type="caption" style={styles.wellnessLabel}>Exercise</ThemedText>
                <ThemedText type="body" style={styles.wellnessValue}>
                  {homeContent?.user_progress?.exercise_minutes
                    ? `${homeContent.user_progress.exercise_minutes}m`
                    : '—'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Progress Summary */}
            {homeContent?.user_progress && (
              <View style={styles.progressSummary}>
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <IconSymbol size={16} name="bed.double.fill" color={Colors.dark.primary} />
                    <ThemedText type="caption" style={styles.progressStatText}>
                      {homeContent.user_progress.sleep_hours || 0}h sleep
                    </ThemedText>
                  </View>
                  <View style={styles.progressStat}>
                    <IconSymbol size={16} name="figure.walk" color={Colors.dark.warning} />
                    <ThemedText type="caption" style={styles.progressStatText}>
                      {homeContent.user_progress.exercise_minutes || 0}m exercise
                    </ThemedText>
                  </View>
                  <View style={styles.progressStat}>
                    <IconSymbol size={16} name="brain.head.profile" color={Colors.dark.secondary} />
                    <ThemedText type="caption" style={styles.progressStatText}>
                      {homeContent.user_progress.meditation_minutes || 0}m meditation
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="caption" style={styles.progressSummaryText}>
                  Track your daily wellness to see patterns over time
                </ThemedText>
              </View>
            )}
          </ModernCard>
        </View>

        {/* Featured Videos - Dynamic from API */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Relaxing Videos 🎬
            </ThemedText>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowAllVideos(!showAllVideos)}
            >
              <ThemedText type="caption" style={styles.viewAllButtonText}>
                {showAllVideos ? 'Show Less' : 'View All'}
              </ThemedText>
              <IconSymbol
                size={16}
                name={showAllVideos ? "chevron.up" : "chevron.right"}
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
                {homeContent.featured_videos.map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.videoCard}
                    onPress={() => openYouTubeVideo(video.youtube_id)}
                  >
                    <View style={styles.videoThumbnail}>
                      <Image
                        source={{ uri: video.thumbnail_url || 'https://via.placeholder.com/300x120/4A90E2/FFFFFF?text=Video' }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                        defaultSource={{ uri: 'https://via.placeholder.com/300x120/4A90E2/FFFFFF?text=Video' }}
                      />
                      <View style={styles.videoOverlay}>
                        <IconSymbol size={24} name="play.fill" color={Colors.dark.background} />
                      </View>
                      <View style={styles.videoDuration}>
                        <ThemedText type="caption" style={styles.durationText}>
                          {formatDuration(video.duration)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.videoInfo}>
                      <ThemedText type="body" style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </ThemedText>
                      <View style={styles.videoMeta}>
                        <View style={[styles.stressLevel, { backgroundColor: video.category.color }]}>
                          <ThemedText type="caption" style={styles.stressLevelText}>
                            {video.stress_level}
                          </ThemedText>
                        </View>
                        <ThemedText type="caption" style={styles.moodBoost}>
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
                  <ThemedText type="body" style={styles.expandedTitle}>
                    All Videos
                  </ThemedText>
                  <View style={styles.videoGrid}>
                    {homeContent.featured_videos.map((video) => (
                      <TouchableOpacity
                        key={`expanded-${video.id}`}
                        style={styles.expandedVideoCard}
                        onPress={() => openYouTubeVideo(video.youtube_id)}
                      >
                        <View style={styles.expandedVideoThumbnail}>
                          <Image
                            source={{ uri: video.thumbnail_url || 'https://via.placeholder.com/200x120/4A90E2/FFFFFF?text=Video' }}
                            style={styles.expandedThumbnailImage}
                            resizeMode="cover"
                          />
                          <View style={styles.videoOverlay}>
                            <IconSymbol size={20} name="play.fill" color={Colors.dark.background} />
                          </View>
                        </View>
                        <View style={styles.expandedVideoInfo}>
                          <ThemedText type="caption" style={styles.expandedVideoTitle} numberOfLines={2}>
                            {video.title}
                          </ThemedText>
                          <View style={styles.expandedVideoMeta}>
                            <View style={[styles.stressLevel, { backgroundColor: video.category.color }]}>
                              <ThemedText type="caption" style={styles.stressLevelText}>
                                {video.stress_level}
                              </ThemedText>
                            </View>
                            <ThemedText type="caption" style={styles.moodBoost}>
                              😊 +{video.mood_boost}
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Load More Button */}
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() => loadMoreContent('videos')}
                  >
                    <IconSymbol size={16} name="plus.circle" color={Colors.dark.primary} />
                    <ThemedText type="caption" style={styles.loadMoreButtonText}>
                      Load More Videos
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <ModernCard variant="elevated" style={styles.placeholderCard}>
              <ThemedText type="body" style={styles.placeholderText}>
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
              <ThemedText type="heading" style={styles.sectionTitle}>
                Nourishing Meals 🍽️
              </ThemedText>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowAllMealPlans(!showAllMealPlans)}
              >
                <ThemedText type="caption" style={styles.viewAllButtonText}>
                  {showAllMealPlans ? 'Show Less' : 'View All'}
                </ThemedText>
                <IconSymbol
                  size={16}
                  name={showAllMealPlans ? "chevron.up" : "chevron.right"}
                  color={Colors.dark.primary}
                />
              </TouchableOpacity>
            </View>
            {homeContent.featured_meal_plans.map((meal) => (
              <ModernCard key={meal.id} variant="elevated" style={styles.mealCard}>
                <View style={styles.mealContent}>
                  <View style={styles.mealImageContainer}>
                    <Image
                      source={{ uri: meal.image_url || 'https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=Meal' }}
                      style={styles.mealImage}
                      resizeMode="cover"
                      defaultSource={{ uri: 'https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=Meal' }}
                    />
                  </View>
                  <View style={styles.mealInfo}>
                    <ThemedText type="body" style={styles.mealTitle}>
                      {meal.title}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.mealDescription} numberOfLines={2}>
                      {meal.description}
                    </ThemedText>
                    <View style={styles.mealMeta}>
                      <View style={[styles.difficulty, { backgroundColor: meal.category.color }]}>
                        <ThemedText type="caption" style={styles.difficultyText}>
                          {meal.difficulty}
                        </ThemedText>
                      </View>
                      <View style={styles.prepTime}>
                        <IconSymbol size={16} name="clock" color={Colors.dark.muted} />
                        <ThemedText type="caption" style={styles.prepTimeText}>
                          {meal.prep_time}m
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </ModernCard>
            ))}

            {/* Expanded meal plans view */}
            {showAllMealPlans && (
              <View style={styles.expandedSection}>
                <ThemedText type="body" style={styles.expandedTitle}>
                  All Meal Plans
                </ThemedText>
                <View style={styles.mealGrid}>
                  {homeContent.featured_meal_plans.map((meal) => (
                    <ModernCard key={`expanded-${meal.id}`} variant="elevated" style={styles.expandedMealCard}>
                      <View style={styles.expandedMealContent}>
                        <View style={styles.expandedMealImageContainer}>
                          <Image
                            source={{ uri: meal.image_url || 'https://via.placeholder.com/120x80/4CAF50/FFFFFF?text=Meal' }}
                            style={styles.expandedMealImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.expandedMealInfo}>
                          <ThemedText type="body" style={styles.expandedMealTitle}>
                            {meal.title}
                          </ThemedText>
                          <ThemedText type="caption" style={styles.expandedMealDescription} numberOfLines={2}>
                            {meal.description}
                          </ThemedText>
                          <View style={styles.expandedMealMeta}>
                            <View style={[styles.difficulty, { backgroundColor: meal.category.color }]}>
                              <ThemedText type="caption" style={styles.difficultyText}>
                                {meal.difficulty}
                              </ThemedText>
                            </View>
                            <View style={styles.prepTime}>
                              <IconSymbol size={16} name="clock" color={Colors.dark.muted} />
                              <ThemedText type="caption" style={styles.prepTimeText}>
                                {meal.prep_time}m
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      </View>
                    </ModernCard>
                  ))}
                </View>

                {/* Load More Button */}
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => loadMoreContent('mealPlans')}
                >
                  <IconSymbol size={16} name="plus.circle" color={Colors.dark.primary} />
                  <ThemedText type="caption" style={styles.loadMoreButtonText}>
                    Load More Meal Plans
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Nourishing Meals 🍽️
            </ThemedText>
            <ModernCard variant="elevated" style={styles.placeholderCard}>
              <ThemedText type="body" style={styles.placeholderText}>
                Loading meal plans...
              </ThemedText>
            </ModernCard>
          </View>
        )}

        {/* Featured Articles - Dynamic from API */}
        {homeContent?.featured_articles && homeContent.featured_articles.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading" style={styles.sectionTitle}>
                Wellness Tips 📚
              </ThemedText>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowAllArticles(!showAllArticles)}
              >
                <ThemedText type="caption" style={styles.viewAllButtonText}>
                  {showAllArticles ? 'Show Less' : 'View All'}
                </ThemedText>
                <IconSymbol
                  size={16}
                  name={showAllArticles ? "chevron.up" : "chevron.right"}
                  color={Colors.dark.primary}
                />
              </TouchableOpacity>
            </View>
            {homeContent.featured_articles.map((article) => (
              <ModernCard key={article.id} variant="elevated" style={styles.articleCard}>
                <View style={styles.articleContent}>
                  <View style={styles.articleImageContainer}>
                    <Image
                      source={{ uri: article.image_url || 'https://via.placeholder.com/80x80/FF9800/FFFFFF?text=Article' }}
                      style={styles.articleImage}
                      resizeMode="cover"
                      defaultSource={{ uri: 'https://via.placeholder.com/80x120/FF9800/FFFFFF?text=Article' }}
                    />
                  </View>
                  <View style={styles.articleInfo}>
                    <ThemedText type="body" style={styles.articleTitle}>
                      {article.title}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.articleExcerpt} numberOfLines={3}>
                      {article.excerpt}
                    </ThemedText>
                    <View style={styles.articleMeta}>
                      <View style={[styles.category, { backgroundColor: article.category.color }]}>
                        <ThemedText type="caption" style={styles.categoryText}>
                          {article.category.name}
                        </ThemedText>
                      </View>
                      <View style={styles.readTime}>
                        <IconSymbol size={16} name="clock" color={Colors.dark.muted} />
                        <ThemedText type="caption" style={styles.readTimeText}>
                          {article.read_time}m read
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </ModernCard>
            ))}

            {/* Expanded articles view */}
            {showAllArticles && (
              <View style={styles.expandedSection}>
                <ThemedText type="body" style={styles.expandedTitle}>
                  All Articles
                </ThemedText>
                <View style={styles.articleGrid}>
                  {homeContent.featured_articles.map((article) => (
                    <ModernCard key={`expanded-${article.id}`} variant="elevated" style={styles.expandedArticleCard}>
                      <View style={styles.expandedArticleContent}>
                        <View style={styles.expandedArticleImageContainer}>
                          <Image
                            source={{ uri: article.image_url || 'https://via.placeholder.com/120x80/FF9800/FFFFFF?text=Article' }}
                            style={styles.expandedArticleImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.expandedArticleInfo}>
                          <ThemedText type="body" style={styles.expandedArticleTitle}>
                            {article.title}
                          </ThemedText>
                          <ThemedText type="caption" style={styles.expandedArticleExcerpt} numberOfLines={2}>
                            {article.excerpt}
                          </ThemedText>
                          <View style={styles.expandedArticleMeta}>
                            <View style={[styles.category, { backgroundColor: article.category.color }]}>
                              <ThemedText type="caption" style={styles.categoryText}>
                                {article.category.name}
                              </ThemedText>
                            </View>
                            <View style={styles.readTime}>
                              <IconSymbol size={16} name="clock" color={Colors.dark.muted} />
                              <ThemedText type="caption" style={styles.readTimeText}>
                                {article.read_time}m read
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      </View>
                    </ModernCard>
                  ))}
                </View>

                {/* Load More Button */}
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => loadMoreContent('articles')}
                >
                  <IconSymbol size={16} name="plus.circle" color={Colors.dark.primary} />
                  <ThemedText type="caption" style={styles.loadMoreButtonText}>
                    Load More Articles
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Wellness Tips 📚
            </ThemedText>
            <ModernCard variant="elevated" style={styles.placeholderCard}>
              <ThemedText type="body" style={styles.placeholderText}>
                Loading articles...
              </ThemedText>
            </ModernCard>
          </View>
        )}

        {/* User Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Your Documents 📄
            </ThemedText>
            <View style={styles.documentActions}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  Alert.alert('Search', 'Document search feature coming soon!');
                }}
              >
                <IconSymbol size={16} name="magnifyingglass" color={Colors.dark.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={fetchUserDocuments}
              >
                <IconSymbol size={16} name="arrow.clockwise" color={Colors.dark.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {documentsLoading ? (
            <ModernCard variant="elevated" style={styles.placeholderCard}>
              <ActivityIndicator size="small" color={Colors.dark.primary} />
              <ThemedText type="body" style={styles.placeholderText}>
                Loading documents...
              </ThemedText>
            </ModernCard>
          ) : userDocuments.length > 0 ? (
            userDocuments.slice(0, 3).map((doc) => (
              <ModernCard key={doc.id} variant="elevated" style={styles.documentCard}>
                <TouchableOpacity
                  style={styles.documentContent}
                  onPress={() => openDocument(doc)}
                >
                  <View style={styles.documentIcon}>
                    <IconSymbol size={24} name="doc.text" color={Colors.dark.primary} />
                  </View>
                  <View style={styles.documentInfo}>
                    <ThemedText type="body" style={styles.documentTitle}>
                      {doc.filename}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.documentMeta}>
                      {doc.category} • {Math.round(doc.fileSize / 1024)}KB
                    </ThemedText>
                  </View>
                  <IconSymbol size={16} name="chevron.right" color={Colors.dark.muted} />
                </TouchableOpacity>
              </ModernCard>
            ))
          ) : (
            <ModernCard variant="elevated" style={styles.placeholderCard}>
              <ThemedText type="body" style={styles.placeholderText}>
                No documents uploaded yet
              </ThemedText>
            </ModernCard>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol size={32} name="mic.fill" color={Colors.dark.primary} />
              <ThemedText type="caption" style={styles.actionText}>Voice Check-in</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol size={32} name="brain.head.profile" color={Colors.dark.warning} />
              <ThemedText type="caption" style={styles.actionText}>Meditation</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol size={32} name="figure.walk" color={Colors.dark.success} />
              <ThemedText type="caption" style={styles.actionText}>Exercise</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol size={32} name="bed.double.fill" color={Colors.dark.secondary} />
              <ThemedText type="caption" style={styles.actionText}>Sleep</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Document Viewer Modal */}
      {showDocumentViewer && selectedDocument && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="heading" style={styles.modalTitle}>
                {selectedDocument.filename}
              </ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeDocumentViewer}
              >
                <IconSymbol size={24} name="xmark" color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.documentDetails}>
                <View style={styles.detailRow}>
                  <ThemedText type="caption" style={styles.detailLabel}>Category:</ThemedText>
                  <ThemedText type="body" style={styles.detailValue}>
                    {selectedDocument.category}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="caption" style={styles.detailLabel}>Size:</ThemedText>
                  <ThemedText type="body" style={styles.detailValue}>
                    {Math.round(selectedDocument.fileSize / 1024)}KB
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="caption" style={styles.detailLabel}>Uploaded:</ThemedText>
                  <ThemedText type="body" style={styles.detailValue}>
                    {new Date(selectedDocument.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>

              {selectedDocument.content && (
                <View style={styles.contentSection}>
                  <ThemedText type="heading" style={styles.contentTitle}>
                    Content
                  </ThemedText>
                  <ThemedText type="body" style={styles.contentText}>
                    {selectedDocument.content}
                  </ThemedText>
                </View>
              )}

              {selectedDocument.summary && (
                <View style={styles.contentSection}>
                  <ThemedText type="heading" style={styles.contentTitle}>
                    Summary
                  </ThemedText>
                  <ThemedText type="body" style={styles.summaryText}>
                    {selectedDocument.summary}
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={closeDocumentViewer}
              >
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
              <ThemedText type="heading" style={styles.modalTitle}>
                Update Your Progress
              </ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeProgressModal}
              >
                <IconSymbol size={24} name="xmark" color={Colors.dark.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Mood Rating */}
              <View style={styles.formSection}>
                <ThemedText type="body" style={styles.formLabel}>
                  How's your mood today? {getMoodEmoji(progressForm.mood_rating)}
                </ThemedText>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        progressForm.mood_rating === rating && styles.ratingButtonActive
                      ]}
                      onPress={() => handleProgressChange('mood_rating', rating)}
                    >
                      <ThemedText style={[
                        styles.ratingText,
                        progressForm.mood_rating === rating && styles.ratingTextActive
                      ]}>
                        {rating}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                <ThemedText type="caption" style={styles.ratingHint}>
                  1 = Very Poor, 10 = Excellent
                </ThemedText>
              </View>

              {/* Stress Level */}
              <View style={styles.formSection}>
                <ThemedText type="body" style={styles.formLabel}>
                  Stress Level: {progressForm.stress_level}/10
                </ThemedText>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity
                    style={styles.sliderTrack}
                    onPress={(e) => {
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
                          { left: `${(progressForm.stress_level / 10) * 100}%` }
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
                <ThemedText type="caption" style={styles.ratingHint}>
                  Low (1-3) • Medium (4-7) • High (8-10)
                </ThemedText>
              </View>

              {/* Sleep Hours */}
              <View style={styles.formSection}>
                <ThemedText type="body" style={styles.formLabel}>
                  How many hours did you sleep? 💤
                </ThemedText>
                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleProgressChange('sleep_hours', Math.max(0, progressForm.sleep_hours - 0.5))}
                  >
                    <IconSymbol size={20} name="minus" color={Colors.dark.primary} />
                  </TouchableOpacity>
                  <View style={styles.numberDisplay}>
                    <ThemedText type="title" style={styles.numberValue}>
                      {progressForm.sleep_hours}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.numberUnit}>hours</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleProgressChange('sleep_hours', Math.min(24, progressForm.sleep_hours + 0.5))}
                  >
                    <IconSymbol size={20} name="plus" color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Exercise Minutes */}
              <View style={styles.formSection}>
                <ThemedText type="body" style={styles.formLabel}>
                  Exercise minutes today 🏃‍♂️
                </ThemedText>
                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleProgressChange('exercise_minutes', Math.max(0, progressForm.exercise_minutes - 5))}
                  >
                    <IconSymbol size={20} name="minus" color={Colors.dark.primary} />
                  </TouchableOpacity>
                  <View style={styles.numberDisplay}>
                    <ThemedText type="title" style={styles.numberValue}>
                      {progressForm.exercise_minutes}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.numberUnit}>minutes</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleProgressChange('exercise_minutes', progressForm.exercise_minutes + 5)}
                  >
                    <IconSymbol size={20} name="plus" color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meditation Minutes */}
              <View style={styles.formSection}>
                <ThemedText type="body" style={styles.formLabel}>
                  Meditation minutes today 🧘‍♀️
                </ThemedText>
                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleProgressChange('meditation_minutes', Math.max(0, progressForm.meditation_minutes - 5))}
                  >
                    <IconSymbol size={20} name="minus" color={Colors.dark.primary} />
                  </TouchableOpacity>
                  <View style={styles.numberDisplay}>
                    <ThemedText type="title" style={styles.numberValue}>
                      {progressForm.meditation_minutes}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.numberUnit}>minutes</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleProgressChange('meditation_minutes', progressForm.meditation_minutes + 5)}
                  >
                    <IconSymbol size={20} name="plus" color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formSection}>
                <ThemedText type="body" style={styles.formLabel}>
                  Any notes for today? 📝
                </ThemedText>
                <View style={styles.notesContainer}>
                  <ThemedText
                    style={styles.notesInput}
                    onTextInput={(e) => handleProgressChange('notes', e.nativeEvent.text)}
                    placeholder="How are you feeling? Any achievements or challenges?"
                    placeholderTextColor={Colors.dark.muted}
                    multiline
                    numberOfLines={3}
                  >
                    {progressForm.notes}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closeProgressModal}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={updateProgress}
                disabled={progressSubmitting}
              >
                {progressSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.dark.background} />
                ) : (
                  <ThemedText style={styles.modalButtonPrimaryText}>Save Progress</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Progress History Modal */}
      {showProgressHistory && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="heading" style={styles.modalTitle}>
                Your Progress History
              </ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProgressHistory(false)}
              >
                <IconSymbol size={24} name="xmark" color={Colors.dark.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {historyLoading ? (
                <View style={styles.historyLoading}>
                  <ActivityIndicator size="large" color={Colors.dark.primary} />
                  <ThemedText type="body" style={styles.historyLoadingText}>
                    Loading your progress history...
                  </ThemedText>
                </View>
              ) : progressHistory.length > 0 ? (
                progressHistory.map((entry, index) => (
                  <View key={index} style={styles.historyEntry}>
                    <View style={styles.historyDate}>
                      <ThemedText type="body" style={styles.historyDateText}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </ThemedText>
                    </View>
                    <View style={styles.historyMetrics}>
                      <View style={styles.historyMetric}>
                        <IconSymbol size={16} name="heart.fill" color={Colors.dark.success} />
                        <ThemedText type="caption" style={styles.historyMetricText}>
                          Mood: {entry.mood_rating}/10
                        </ThemedText>
                      </View>
                      <View style={styles.historyMetric}>
                        <IconSymbol size={16} name="brain.head.profile" color={getStressLevelColor(entry.stress_level)} />
                        <ThemedText type="caption" style={styles.historyMetricText}>
                          Stress: {entry.stress_level}/10
                        </ThemedText>
                      </View>
                      <View style={styles.historyMetric}>
                        <IconSymbol size={16} name="bed.double.fill" color={Colors.dark.primary} />
                        <ThemedText type="caption" style={styles.historyMetricText}>
                          Sleep: {entry.sleep_hours}h
                        </ThemedText>
                      </View>
                      <View style={styles.historyMetric}>
                        <IconSymbol size={16} name="figure.walk" color={Colors.dark.warning} />
                        <ThemedText type="caption" style={styles.historyMetricText}>
                          Exercise: {entry.exercise_minutes}m
                        </ThemedText>
                      </View>
                      <View style={styles.historyMetric}>
                        <IconSymbol size={16} name="brain.head.profile" color={Colors.dark.secondary} />
                        <ThemedText type="caption" style={styles.historyMetricText}>
                          Meditation: {entry.meditation_minutes}m
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.historyEmpty}>
                  <IconSymbol size={48} name="chart.line.uptrend.xyaxis" color={Colors.dark.muted} />
                  <ThemedText type="body" style={styles.historyEmptyText}>
                    No progress history yet
                  </ThemedText>
                  <ThemedText type="caption" style={styles.historyEmptySubtext}>
                    Start tracking your daily wellness to see your progress over time
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setShowProgressHistory(false)}
              >
                <ThemedText style={styles.modalButtonPrimaryText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    color: Colors.dark.text,
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
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.muted + '20',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  documentDetails: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.muted + '20',
  },
  detailLabel: {
    opacity: 0.7,
    fontWeight: '600',
  },
  detailValue: {
    fontWeight: '500',
  },
  contentSection: {
    marginTop: Spacing.lg,
  },
  contentTitle: {
    marginBottom: Spacing.md,
    fontSize: 18,
  },
  contentText: {
    lineHeight: 24,
    opacity: 0.9,
  },
  summaryText: {
    lineHeight: 22,
    opacity: 0.8,
    fontStyle: 'italic',
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

  // Progress tracking modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
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
    borderBottomColor: Colors.dark.muted + '20',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  modalBody: {
    padding: Spacing.lg,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.muted + '20',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.dark.primary,
  },
  modalButtonSecondary: {
    backgroundColor: Colors.dark.muted + '20',
  },
  modalButtonPrimaryText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
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
