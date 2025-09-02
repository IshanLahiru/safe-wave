import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { apiService } from '@/services/api';

interface AnalyticsData {
  period: string;
  metrics: {
    total_checkins: number;
    period_checkins: number;
    completion_rate: number;
    period_completion_rate: number;
    avg_duration: number;
    checkin_trend: string;
    completion_trend: string;
  };
  risk_distribution: Record<string, number>;
  daily_pattern: Record<string, number>;
  weekly_trend: Array<{
    week: string;
    checkins: number;
    completed: number;
  }>;
  recent_activity: Array<{
    id: string;
    type: string;
    status: string;
    risk_level?: string;
    duration?: number;
    timestamp: string;
    time_ago: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    value: string;
    description: string;
  }>;
}

export default function AnalyticsScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periods = [
    { id: 'week', label: 'Week', active: selectedPeriod === 'week' },
    { id: 'month', label: 'Month', active: selectedPeriod === 'month' },
    { id: 'quarter', label: 'Quarter', active: selectedPeriod === 'quarter' },
    { id: 'year', label: 'Year', active: selectedPeriod === 'year' },
  ];

  const fetchAnalytics = async (period: string = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching analytics for period:', period);

      // Use real analytics endpoint with period parameter
      const response = await apiService.request<AnalyticsData>(`/api/v1/analytics/dashboard?period=${period}`);
      console.log('Analytics data:', response);
      setAnalyticsData(response);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(`Failed to load analytics data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#4CAF50';
      default: return Colors.dark.text;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return 'star.fill';
      case 'warning': return 'exclamationmark.triangle.fill';
      case 'alert': return 'exclamationmark.octagon.fill';
      case 'success': return 'checkmark.circle.fill';
      default: return 'info.circle.fill';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return '#FFD700';
      case 'warning': return Colors.dark.warning;
      case 'alert': return '#ff4444';
      case 'success': return Colors.dark.success;
      default: return Colors.dark.primary;
    }
  };

  if (loading && !analyticsData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20, // Add safe area top padding
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <IconSymbol size={60} name="chart.line.uptrend.xyaxis" color={Colors.dark.primary} />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            📊 Analytics Dashboard
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            {user?.name ? `${user.name}'s Progress` : 'Your Progress'}
          </ThemedText>
        </ThemedView>

        {error && (
          <ModernCard variant="outlined" style={styles.errorCard}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchAnalytics()}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ModernCard>
        )}

        {/* Period Selector */}
        <ModernCard variant="outlined" style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                period.active && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <ThemedText style={[
                styles.periodButtonText,
                period.active && styles.periodButtonTextActive
              ]}>
                {period.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ModernCard>

        {analyticsData && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              <ModernCard variant="elevated" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <IconSymbol size={20} name="mic.fill" color={Colors.dark.success} />
                  <ThemedText type="caption" style={styles.metricLabel}>Total Check-ins</ThemedText>
                </View>
                <ThemedText type="title" style={styles.metricValue}>
                  {analyticsData.metrics.total_checkins}
                </ThemedText>
                <View style={styles.metricTrend}>
                  <IconSymbol
                    size={14}
                    name={analyticsData.metrics.checkin_trend.startsWith('+') ? "arrow.up.right" : "arrow.down.right"}
                    color={analyticsData.metrics.checkin_trend.startsWith('+') ? Colors.dark.success : Colors.dark.danger}
                  />
                  <ThemedText type="caption" style={styles.trendText}>
                    {analyticsData.metrics.checkin_trend}
                  </ThemedText>
                </View>
              </ModernCard>

              <ModernCard variant="elevated" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <IconSymbol size={20} name="checkmark.circle.fill" color={Colors.dark.primary} />
                  <ThemedText type="caption" style={styles.metricLabel}>Completion Rate</ThemedText>
                </View>
                <ThemedText type="title" style={styles.metricValue}>
                  {analyticsData.metrics.completion_rate}%
                </ThemedText>
                <View style={styles.metricTrend}>
                  <IconSymbol
                    size={14}
                    name={analyticsData.metrics.completion_trend.startsWith('+') ? "arrow.up.right" : "arrow.down.right"}
                    color={analyticsData.metrics.completion_trend.startsWith('+') ? Colors.dark.success : Colors.dark.danger}
                  />
                  <ThemedText type="caption" style={styles.trendText}>
                    {analyticsData.metrics.completion_trend}
                  </ThemedText>
                </View>
              </ModernCard>

              <ModernCard variant="elevated" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <IconSymbol size={20} name="clock.fill" color={Colors.dark.warning} />
                  <ThemedText type="caption" style={styles.metricLabel}>Avg Duration</ThemedText>
                </View>
                <ThemedText type="title" style={styles.metricValue}>
                  {analyticsData.metrics.avg_duration}s
                </ThemedText>
                <ThemedText type="caption" style={styles.metricSubtext}>
                  Per check-in
                </ThemedText>
              </ModernCard>
            </View>

            {/* Risk Distribution */}
            {Object.keys(analyticsData.risk_distribution).length > 0 && (
              <View style={styles.section}>
                <ThemedText type="heading" style={styles.sectionTitle}>Risk Level Distribution</ThemedText>
                <ModernCard variant="elevated" style={styles.riskContainer}>
                  {Object.entries(analyticsData.risk_distribution).map(([risk, count]) => (
                    <View key={risk} style={styles.riskItem}>
                      <View style={styles.riskInfo}>
                        <View style={[styles.riskDot, { backgroundColor: getRiskLevelColor(risk) }]} />
                        <ThemedText type="body" style={styles.riskLabel}>
                          {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                        </ThemedText>
                      </View>
                      <ThemedText type="heading" style={styles.riskCount}>{count}</ThemedText>
                    </View>
                  ))}
                </ModernCard>
              </View>
            )}

            {/* Daily Pattern */}
            <View style={styles.section}>
              <ThemedText type="heading" style={styles.sectionTitle}>Daily Check-in Pattern</ThemedText>
              <ModernCard variant="elevated" style={styles.dailyContainer}>
                {(() => {
                  // Calculate the maximum count for proper scaling
                  const maxCount = Math.max(...Object.values(analyticsData.daily_pattern));
                  const minBarHeight = 4; // Minimum bar height in pixels

                  // Account for all text elements and spacing
                  const containerHeight = 120; // Total container height
                  const sectionTitleHeight = 24; // Section title "Daily Check-in Pattern"
                  const dayLabelHeight = 16; // Day labels (Mon, Tue, etc.)
                  const countLabelHeight = 14; // Count labels (0, 1, 2, etc.)
                  const padding = 16; // Container padding
                  const margins = 16; // Margins between elements

                  // Calculate available height for bars
                  const availableHeight = containerHeight - sectionTitleHeight - dayLabelHeight - countLabelHeight - padding - margins;
                  const maxBarHeight = Math.max(availableHeight, 40); // Ensure minimum 40px max height

                  return Object.entries(analyticsData.daily_pattern).map(([day, count]) => {
                    // Calculate scaled height with strict container constraints
                    const scaledHeight = maxCount > 0
                      ? Math.min(Math.max((count / maxCount) * maxBarHeight, minBarHeight), availableHeight)
                      : minBarHeight;

                    return (
                      <View key={day} style={styles.dailyItem}>
                        <ThemedText type="caption" style={styles.dailyLabel}>{day.slice(0, 3)}</ThemedText>
                        <View style={[styles.dailyBar, { height: scaledHeight }]} />
                        <ThemedText type="caption" style={styles.dailyCount}>{count}</ThemedText>
                      </View>
                    );
                  });
                })()}
              </ModernCard>
            </View>

            {/* Performance Insights */}
            {analyticsData.insights.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="heading" style={styles.sectionTitle}>Performance Insights</ThemedText>
                {analyticsData.insights.map((insight, index) => (
                  <ModernCard key={index} variant="elevated" style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <IconSymbol
                        size={20}
                        name={getInsightIcon(insight.type)}
                        color={getInsightColor(insight.type)}
                      />
                      <ThemedText type="subtitle" style={styles.insightTitle}>{insight.title}</ThemedText>
                    </View>
                    <ThemedText type="heading" style={styles.insightValue}>{insight.value}</ThemedText>
                    <ThemedText type="caption" style={styles.insightDescription}>{insight.description}</ThemedText>
                  </ModernCard>
                ))}
              </View>
            )}

            {/* Recent Activity */}
            {analyticsData.recent_activity.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="heading" style={styles.sectionTitle}>Recent Activity</ThemedText>
                {analyticsData.recent_activity.map((activity) => (
                  <ModernCard key={activity.id} variant="outlined" style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <IconSymbol
                        size={16}
                        name="mic.fill"
                        color={activity.status === 'completed' ? Colors.dark.success : Colors.dark.warning}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <ThemedText type="body" style={styles.activityText}>
                        {activity.type} {activity.status}
                        {activity.risk_level && (
                          <ThemedText style={[styles.activityRisk, { color: getRiskLevelColor(activity.risk_level) }]}>
                            {' '}({activity.risk_level})
                          </ThemedText>
                        )}
                      </ThemedText>
                      <ThemedText type="caption" style={styles.activityTime}>{activity.time_ago}</ThemedText>
                    </View>
                  </ModernCard>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    marginTop: 16,
    color: Colors.dark.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },
  errorCard: {
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  periodButtonTextActive: {
    color: Colors.dark.background,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    padding: 12,
    minWidth: 0, // Allow flex items to shrink below their content size
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metricLabel: {
    marginLeft: 8,
    opacity: 0.8,
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    flexShrink: 1,
    textAlign: 'center',
  },
  metricSubtext: {
    opacity: 0.6,
    textAlign: 'center',
    fontSize: 12,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  trendText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  riskContainer: {
    padding: 16,
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  riskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  riskLabel: {
    fontSize: 16,
  },
  riskCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dailyContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    overflow: 'hidden', // Prevent bars from overflowing
  },
  dailyItem: {
    alignItems: 'center',
    flex: 1,
  },
  dailyLabel: {
    marginBottom: 8,
    opacity: 0.8,
  },
  dailyBar: {
    width: 20,
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
    marginBottom: 8,
    maxHeight: 50, // Reduced constraint to account for all text elements
  },
  dailyCount: {
    fontSize: 12,
    opacity: 0.8,
  },
  insightCard: {
    marginBottom: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    opacity: 0.8,
    lineHeight: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    marginBottom: 4,
  },
  activityRisk: {
    fontWeight: '600',
  },
  activityTime: {
    opacity: 0.6,
    fontSize: 14,
  },
});
