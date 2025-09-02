import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';

export default function OnboardingAnalysisTest() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestOnboardingAnalysis = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to test onboarding analysis');
      return;
    }

    if (!user.carePersonEmail) {
      Alert.alert(
        'No Care Person Email',
        'You need to complete onboarding with a care person email to test this feature.',
        [
          { text: 'Complete Onboarding', onPress: () => {} },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing onboarding analysis...');
      const result = await apiService.testOnboardingAnalysis();

      console.log('✅ Test result:', result);

      Alert.alert(
        'Test Completed',
        `Onboarding analysis test completed!\n\n${result.message}\n\nCare Person Email: ${result.care_person_email}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Test failed:', error);

      let errorMessage = 'Test failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Test Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>Please log in to test onboarding analysis</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={24} name='testtube.2' color={theme.tint} />
        <ThemedText type='title' style={styles.title}>
          Onboarding Analysis Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test the onboarding analysis and email system
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.infoTitle}>Current User Info:</ThemedText>
        <ThemedText style={styles.infoText}>Name: {user.name}</ThemedText>
        <ThemedText style={styles.infoText}>Email: {user.email}</ThemedText>
        <ThemedText style={styles.infoText}>
          Care Person Email: {user.carePersonEmail || 'Not configured'}
        </ThemedText>
        <ThemedText style={styles.infoText}>
          Onboarding Complete: {user.isOnboardingComplete ? 'Yes' : 'No'}
        </ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={[styles.testButton, (!user.carePersonEmail || isLoading) && styles.disabledButton]}
        onPress={handleTestOnboardingAnalysis}
        disabled={!user.carePersonEmail || isLoading}
      >
        <IconSymbol size={20} name={isLoading ? 'clock' : 'paperplane'} color='white' />
        <ThemedText style={styles.testButtonText}>
          {isLoading ? 'Testing...' : 'Test Onboarding Analysis'}
        </ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.helpContainer}>
        <ThemedText style={styles.helpTitle}>What this test does:</ThemedText>
        <ThemedText style={styles.helpText}>
          • Analyzes your onboarding questionnaire answers using AI
        </ThemedText>
        <ThemedText style={styles.helpText}>
          • Sends an email to your care person with the analysis
        </ThemedText>
        <ThemedText style={styles.helpText}>
          • Simulates what happens when audio analysis fails
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  infoContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 30,
    gap: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#687076',
  },
  helpContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#007AFF',
  },
  helpText: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 22,
  },
});
