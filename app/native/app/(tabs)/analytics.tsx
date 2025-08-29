import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';

export default function AnalyticsScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periods = [
    { id: 'week', label: 'Week', active: selectedPeriod === 'week' },
    { id: 'month', label: 'Month', active: selectedPeriod === 'month' },
    { id: 'quarter', label: 'Quarter', active: selectedPeriod === 'quarter' },
    { id: 'year', label: 'Year', active: selectedPeriod === 'year' },
  ];

  const mockData = {
    week: { checkins: 7, completion: 85, trend: '+12%' },
    month: { checkins: 28, completion: 92, trend: '+8%' },
    quarter: { checkins: 84, completion: 89, trend: '+15%' },
    year: { checkins: 336, completion: 91, trend: '+22%' },
  };

  const currentData = mockData[selectedPeriod as keyof typeof mockData];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 60), // Safe area + minimum padding
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerLeft}>
            <IconSymbol size={40} name="chart.line.uptrend.xyaxis" color="#007AFF" />
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title" style={styles.title}>Analytics</ThemedText>
              <ThemedText style={styles.subtitle}>
                {user?.name ? `${user.name}'s Progress` : 'Your Progress'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Period Selector */}
        <ThemedView style={styles.periodSelector}>
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
        </ThemedView>

        {/* Key Metrics */}
        <ThemedView style={styles.metricsContainer}>
          <ThemedView style={styles.metricCard}>
            <ThemedView style={styles.metricHeader}>
              <IconSymbol size={24} name="mic.fill" color="#34C759" />
              <ThemedText style={styles.metricLabel}>Total Check-ins</ThemedText>
            </ThemedView>
            <ThemedText type="title" style={styles.metricValue}>{currentData.checkins}</ThemedText>
            <ThemedView style={styles.metricTrend}>
              <IconSymbol size={16} name="arrow.up.right" color="#34C759" />
              <ThemedText style={styles.trendText}>{currentData.trend}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.metricCard}>
            <ThemedView style={styles.metricHeader}>
              <IconSymbol size={24} name="checkmark.circle.fill" color="#007AFF" />
              <ThemedText style={styles.metricLabel}>Completion Rate</ThemedText>
            </ThemedView>
            <ThemedText type="title" style={styles.metricValue}>{currentData.completion}%</ThemedText>
            <ThemedView style={styles.metricTrend}>
              <IconSymbol size={16} name="arrow.up.right" color="#007AFF" />
              <ThemedText style={styles.trendText}>+5%</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Chart Section */}
        <ThemedView style={styles.chartSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Check-in Trends</ThemedText>
          <ThemedView style={styles.chartContainer}>
            <ThemedView style={styles.chartPlaceholder}>
              <IconSymbol size={60} name="chart.bar.fill" color="#007AFF" />
              <ThemedText style={styles.chartPlaceholderText}>Chart Visualization</ThemedText>
              <ThemedText style={styles.chartPlaceholderSubtext}>Interactive charts coming soon</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Performance Insights */}
        <ThemedView style={styles.insightsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Performance Insights</ThemedText>

          <ThemedView style={styles.insightCard}>
            <ThemedView style={styles.insightHeader}>
              <IconSymbol size={20} name="star.fill" color="#FFD700" />
              <ThemedText style={styles.insightTitle}>Best Performance Day</ThemedText>
            </ThemedView>
            <ThemedText style={styles.insightValue}>Wednesday</ThemedText>
            <ThemedText style={styles.insightDescription}>95% completion rate on mid-week check-ins</ThemedText>
          </ThemedView>

          <ThemedView style={styles.insightCard}>
            <ThemedView style={styles.insightHeader}>
              <IconSymbol size={20} name="exclamationmark.triangle.fill" color="#FF9500" />
              <ThemedText style={styles.insightTitle}>Areas for Improvement</ThemedText>
            </ThemedView>
            <ThemedText style={styles.insightValue}>Weekend Check-ins</ThemedText>
            <ThemedText style={styles.insightDescription}>Lower completion rates on Saturdays and Sundays</ThemedText>
          </ThemedView>

          <ThemedView style={styles.insightCard}>
            <ThemedView style={styles.insightHeader}>
              <IconSymbol size={20} name="target" color="#34C759" />
              <ThemedText style={styles.insightTitle}>Goal Achievement</ThemedText>
            </ThemedView>
            <ThemedText style={styles.insightValue}>On Track</ThemedText>
            <ThemedText style={styles.insightDescription}>Exceeding monthly targets by 15%</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Recent Activity */}
        <ThemedView style={styles.activitySection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Activity</ThemedText>

          <ThemedView style={styles.activityItem}>
            <ThemedView style={styles.activityIcon}>
              <IconSymbol size={16} name="mic.fill" color="#34C759" />
            </ThemedView>
            <ThemedView style={styles.activityContent}>
              <ThemedText style={styles.activityText}>Daily check-in completed</ThemedText>
              <ThemedText style={styles.activityTime}>2 hours ago</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.activityItem}>
            <ThemedView style={styles.activityIcon}>
              <IconSymbol size={16} name="checkmark.circle.fill" color="#007AFF" />
            </ThemedView>
            <ThemedView style={styles.activityContent}>
              <ThemedText style={styles.activityText}>Weekly report generated</ThemedText>
              <ThemedText style={styles.activityTime}>1 day ago</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.activityItem}>
            <ThemedView style={styles.activityIcon}>
              <IconSymbol size={16} name="chart.line.uptrend.xyaxis" color="#FF9500" />
            </ThemedView>
            <ThemedView style={styles.activityContent}>
              <ThemedText style={styles.activityText}>Trend analysis updated</ThemedText>
              <ThemedText style={styles.activityTime}>3 days ago</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Increased to account for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    color: '#007AFF',
  },

  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  chartSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#007AFF',
  },
  chartContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: 30,
    alignItems: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    gap: 10,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    opacity: 0.5,
  },
  insightsSection: {
    marginBottom: 25,
  },
  insightCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  activitySection: {
    marginBottom: 25,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    opacity: 0.6,
  },
});
