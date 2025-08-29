import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import ApiConnectionTest from '@/components/ApiConnectionTest';
import apiService from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const handleStartCheckin = () => {
    router.push('/(tabs)/checkin');
  };

  const handleOnboarding = () => {
    router.push('/onboarding-questionnaire');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Math.max(insets.top + 20, 60), // Safe area + minimum padding
        }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Message */}
      <ThemedView style={styles.welcomeCard}>
        <ThemedText type="title" style={styles.welcomeTitle}>
          Welcome back, {user?.name || 'User'}! 👋
        </ThemedText>
        <ThemedText style={styles.welcomeSubtitle}>
          {user?.isOnboardingComplete
            ? 'Ready for your daily check-in?'
            : 'Let\'s get you set up with the app'
          }
        </ThemedText>
      </ThemedView>

      {/* Daily Check-in Card */}
      <ThemedView style={styles.checkinCard}>
        <ThemedView style={styles.checkinIconContainer}>
          <IconSymbol size={40} name="mic.fill" color="white" />
        </ThemedView>
        <ThemedText type="title" style={styles.checkinTitle}>Daily Check-in</ThemedText>
        <ThemedText style={styles.checkinQuestion}>How are you feeling today?</ThemedText>
        {user?.isOnboardingComplete ? (
          <TouchableOpacity style={styles.checkinButton} onPress={handleStartCheckin}>
            <ThemedText style={styles.checkinButtonText}>Start Check-in</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.onboardingButton} onPress={handleOnboarding}>
            <ThemedText style={styles.onboardingButtonText}>Complete Onboarding</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Statistics Cards */}
      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statCard}>
          <IconSymbol size={24} name="message.fill" color="#007AFF" />
          <ThemedText type="title" style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Total Check-ins</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol size={24} name="calendar" color="#007AFF" />
          <ThemedText type="title" style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>This Week</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color="#007AFF" />
          <ThemedText type="title" style={styles.statNumber}>Stable</ThemedText>
          <ThemedText style={styles.statLabel}>Trend</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Token Status */}
      <ThemedView style={styles.tokenStatusCard}>
        <ThemedText type="title" style={styles.tokenStatusTitle}>
          🔐 Token Status
        </ThemedText>
        <ThemedText style={styles.tokenStatusSubtitle}>
          Monitor your authentication tokens
        </ThemedText>
        <TouchableOpacity
          style={styles.tokenStatusButton}
          onPress={async () => {
            try {
              const tokens = await apiService.getStoredTokens();
              const message = `Access Token: ${tokens.accessToken ? '✅ Valid' : '❌ Missing'}\nRefresh Token: ${tokens.refreshToken ? '✅ Valid' : '❌ Missing'}`;
              alert(message);
            } catch (error) {
              alert(`Error: ${error}`);
            }
          }}
        >
          <ThemedText style={styles.tokenStatusButtonText}>Check Tokens</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* API Connection Test */}
      <ThemedView style={styles.apiTestCard}>
        <ThemedText type="title" style={styles.apiTestTitle}>
          🔌 API Connection Test
        </ThemedText>
        <ThemedText style={styles.apiTestSubtitle}>
          Test your frontend-backend connection
        </ThemedText>
        <TouchableOpacity
          style={styles.apiTestButton}
          onPress={() => router.push('/api-test')}
        >
          <ThemedText style={styles.apiTestButtonText}>Test Connection</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Debug Section */}
      <ThemedView style={styles.debugCard}>
        <ThemedText type="title" style={styles.debugTitle}>
          🐛 Debug Tools
        </ThemedText>
        <ThemedText style={styles.debugSubtitle}>
          Development and testing utilities
        </ThemedText>
        <View style={styles.debugButtons}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              const { forceLogout } = useUser();
              await forceLogout();
            }}
          >
            <ThemedText style={styles.debugButtonText}>Force Logout</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              const tokens = await apiService.getStoredTokens();
              alert(`Access Token: ${tokens.accessToken ? '✅ Valid' : '❌ Missing'}\nRefresh Token: ${tokens.refreshToken ? '✅ Valid' : '❌ Missing'}`);
            }}
          >
            <ThemedText style={styles.debugButtonText}>Check Tokens</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

    </ScrollView>
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
  welcomeCard: {
    backgroundColor: 'rgba(88, 86, 214, 0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.1)',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#5856D6',
  },
  welcomeSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  checkinCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  checkinIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  checkinQuestion: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 25,
    textAlign: 'center',
  },
  checkinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  checkinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  onboardingButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  onboardingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  apiTestCard: {
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  apiTestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  apiTestSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  apiTestButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  apiTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tokenStatusCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.1)',
  },
  tokenStatusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tokenStatusSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  tokenStatusButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  tokenStatusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  debugCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  debugTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FF3B30',
  },
  debugSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  debugButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
