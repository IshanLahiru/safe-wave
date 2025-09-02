import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AudioAnalysisResultsProps {
  analysis: {
    transcription?: string;
    riskLevel?: string;
    mentalHealthIndicators?: any;
    llmAnalysis?: any;
    createdAt: string;
  };
  onClose: () => void;
}

export default function AudioAnalysisResults({ analysis, onClose }: AudioAnalysisResultsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      default:
        return '#687076';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'exclamationmark.triangle.fill';
      case 'high':
        return 'exclamationmark.circle.fill';
      case 'medium':
        return 'info.circle.fill';
      case 'low':
        return 'checkmark.circle.fill';
      default:
        return 'questionmark.circle.fill';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type='title' style={styles.title}>
          🧠 Analysis Results
        </ThemedText>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <IconSymbol size={24} name='xmark' color='#687076' />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Risk Level */}
        {analysis.riskLevel && (
          <View style={styles.riskSection}>
            <View style={styles.riskHeader}>
              <IconSymbol
                size={24}
                name={getRiskLevelIcon(analysis.riskLevel)}
                color={getRiskLevelColor(analysis.riskLevel)}
              />
              <ThemedText type='title' style={styles.riskTitle}>
                Risk Level: {analysis.riskLevel.toUpperCase()}
              </ThemedText>
            </View>
            <View
              style={[
                styles.riskIndicator,
                { backgroundColor: getRiskLevelColor(analysis.riskLevel) + '20' },
              ]}
            >
              <ThemedText style={styles.riskDescription}>
                {analysis.riskLevel === 'critical' &&
                  'Immediate attention required. Care person has been notified.'}
                {analysis.riskLevel === 'high' &&
                  'High risk indicators detected. Consider reaching out for support.'}
                {analysis.riskLevel === 'medium' && 'Some concerning indicators. Monitor closely.'}
                {analysis.riskLevel === 'low' && 'Low risk. Continue with current support plan.'}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Transcription */}
        {analysis.transcription && (
          <View style={styles.section}>
            <ThemedText type='title' style={styles.sectionTitle}>
              �� What You Said
            </ThemedText>
            <View style={styles.transcriptionBox}>
              <ThemedText style={styles.transcriptionText}>"{analysis.transcription}"</ThemedText>
            </View>
          </View>
        )}

        {/* Mental Health Indicators */}
        {analysis.mentalHealthIndicators && (
          <View style={styles.section}>
            <ThemedText type='title' style={styles.sectionTitle}>
              🔍 Key Indicators
            </ThemedText>
            {Object.entries(analysis.mentalHealthIndicators).map(([key, value]) => (
              <View key={key} style={styles.indicatorItem}>
                <ThemedText style={styles.indicatorKey}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </ThemedText>
                <ThemedText style={styles.indicatorValue}>{String(value)}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* LLM Analysis Summary */}
        {analysis.llmAnalysis?.summary && (
          <View style={styles.section}>
            <ThemedText type='title' style={styles.sectionTitle}>
              💡 AI Insights
            </ThemedText>
            <View style={styles.insightsBox}>
              <ThemedText style={styles.insightsText}>{analysis.llmAnalysis.summary}</ThemedText>
            </View>
          </View>
        )}

        {/* Recommendations */}
        {analysis.llmAnalysis?.recommendations && (
          <View style={styles.section}>
            <ThemedText type='title' style={styles.sectionTitle}>
              🎯 Recommendations
            </ThemedText>
            {analysis.llmAnalysis.recommendations.map((rec: string, index: number) => (
              <View key={index} style={styles.recommendationItem}>
                <IconSymbol size={16} name='checkmark.circle.fill' color='#34C759' />
                <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.timestampSection}>
          <ThemedText style={styles.timestampText}>
            Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton}>
          <ThemedText style={styles.primaryButtonText}>Save to Journal</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <ThemedText style={styles.secondaryButtonText}>Share with Care Team</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  riskSection: {
    marginBottom: 24,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  riskIndicator: {
    padding: 16,
    borderRadius: 12,
  },
  riskDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#11181C',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#11181C',
  },
  transcriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#11181C',
    fontStyle: 'italic',
  },
  indicatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  indicatorKey: {
    fontSize: 14,
    fontWeight: '500',
    color: '#11181C',
  },
  indicatorValue: {
    fontSize: 14,
    color: '#687076',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  insightsBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#007AFF',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recommendationText: {
    fontSize: 14,
    marginLeft: 12,
    color: '#11181C',
    flex: 1,
  },
  timestampSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  timestampText: {
    fontSize: 12,
    color: '#687076',
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
