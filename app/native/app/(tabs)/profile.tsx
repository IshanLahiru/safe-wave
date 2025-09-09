import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsetsSafe } from '@/hooks/useSafeAreaInsetsSafe';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import OnboardingAnalysisTest from '@/components/OnboardingAnalysisTest';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useUser();
  const insets = useSafeAreaInsetsSafe();

  const handleOnboardingQuestionnaire = () => {
    router.push('/onboarding-questionnaire');
  };

  const handleLogout = async () => {
    // Web has limited Alert support; use window.confirm for deterministic behavior
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out?')
          : true;

      if (confirmed) {
        console.log('Logout confirmed (web)');
        await logout();
        router.replace('/auth/login');
      }
      return;
    }

    // Native platforms use Alert with async onPress to ensure full cleanup before navigating
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          console.log('Logout confirmed (native)');
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20, // Add safe area top padding
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <IconSymbol size={60} name='person.fill' color={Colors.dark.primary} />
          </ThemedView>
          <ThemedText type='title' style={styles.title}>
            👤 Profile
          </ThemedText>
          <ThemedText type='body' style={styles.subtitle}>
            {user?.name || 'User'} •{' '}
            {user?.role === 'healthcare_provider' ? 'Healthcare Provider' : 'User'}
          </ThemedText>
        </ThemedView>

        {/* User Status */}
        <ModernCard variant='elevated' style={styles.userStatusCard}>
          <ThemedText type='heading' style={styles.userStatusTitle}>
            {user?.isOnboardingComplete ? '✅ Onboarding Complete' : '⏳ Onboarding Pending'}
          </ThemedText>
          <ThemedText type='body' style={styles.userStatusSubtitle}>
            {user?.isOnboardingComplete
              ? "You're all set up and ready to use the app!"
              : 'Complete the onboarding questionnaire to get started'}
          </ThemedText>
        </ModernCard>

        {/* Emergency Contact Info */}
        {user?.emergencyContact && (
          <ModernCard variant='elevated' style={styles.emergencyContactCard}>
            <ThemedText type='heading' style={styles.emergencyContactTitle}>
              🚨 Emergency Contact
            </ThemedText>
            <View style={styles.contactInfo}>
              <ThemedText type='body' style={styles.contactLabel}>
                Name:
              </ThemedText>
              <ThemedText type='body' style={styles.contactValue}>
                {user.emergencyContact.name}
              </ThemedText>
            </View>
            <View style={styles.contactInfo}>
              <ThemedText type='body' style={styles.contactLabel}>
                Email:
              </ThemedText>
              <ThemedText type='body' style={styles.contactValue}>
                {user.emergencyContact.email}
              </ThemedText>
            </View>
            <View style={styles.contactInfo}>
              <ThemedText type='body' style={styles.contactLabel}>
                Relationship:
              </ThemedText>
              <ThemedText type='body' style={styles.contactValue}>
                {user.emergencyContact.relationship}
              </ThemedText>
            </View>
          </ModernCard>
        )}

        {/* Care Person Info */}
        {user?.carePersonEmail && (
          <ModernCard variant='elevated' style={styles.carePersonCard}>
            <ThemedText type='heading' style={styles.carePersonTitle}>
              👥 Care Person
            </ThemedText>
            <ThemedText type='body' style={styles.carePersonEmail}>
              {user.carePersonEmail}
            </ThemedText>
            <ThemedText type='caption' style={styles.carePersonSubtitle}>
              This person will be notified of your check-ins and any concerns
            </ThemedText>
          </ModernCard>
        )}

        {/* User Preferences */}
        {user?.preferences && (
          <ModernCard variant='elevated' style={styles.preferencesCard}>
            <ThemedText type='heading' style={styles.preferencesTitle}>
              ⚙️ Preferences
            </ThemedText>
            <View style={styles.preferenceItem}>
              <ThemedText type='body' style={styles.preferenceLabel}>
                Check-in Frequency:
              </ThemedText>
              <ThemedText type='body' style={styles.preferenceValue}>
                {user.preferences.checkinFrequency}
              </ThemedText>
            </View>
            <View style={styles.preferenceItem}>
              <ThemedText type='body' style={styles.preferenceLabel}>
                Dark Mode:
              </ThemedText>
              <ThemedText type='body' style={styles.preferenceValue}>
                {user.preferences.darkMode ? 'Enabled' : 'Disabled'}
              </ThemedText>
            </View>
            <View style={styles.preferenceItem}>
              <ThemedText type='body' style={styles.preferenceLabel}>
                Language:
              </ThemedText>
              <ThemedText type='body' style={styles.preferenceValue}>
                {user.preferences.language.toUpperCase()}
              </ThemedText>
            </View>
          </ModernCard>
        )}

        {/* Account Section */}
        <ModernCard variant='elevated' style={styles.section}>
          <ThemedText type='heading' style={styles.sectionTitle}>
            Account
          </ThemedText>

          <TouchableOpacity style={styles.settingRow} onPress={handleOnboardingQuestionnaire}>
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name='doc.text.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.settingLabel}>
                Onboarding Questionnaire
              </ThemedText>
            </View>
            <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/medical-documents')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name='heart.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.settingLabel}>
                Medical Documents
              </ThemedText>
            </View>
            <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/privacy-security')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name='lock.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.settingLabel}>
                Privacy & Security
              </ThemedText>
            </View>
            <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
          </TouchableOpacity>
        </ModernCard>

        {/* Support Section */}
        <ModernCard variant='elevated' style={styles.section}>
          <ThemedText type='heading' style={styles.sectionTitle}>
            Support
          </ThemedText>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/help-faq')}>
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name='questionmark.circle.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.settingLabel}>
                Help & FAQ
              </ThemedText>
            </View>
            <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/send-feedback')}>
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name='envelope.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.settingLabel}>
                Send Feedback
              </ThemedText>
            </View>
            <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/about')}>
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name='info.circle.fill' color={Colors.dark.primary} />
              <ThemedText type='body' style={styles.settingLabel}>
                About
              </ThemedText>
            </View>
            <IconSymbol size={16} name='chevron.right' color={Colors.dark.muted} />
          </TouchableOpacity>
        </ModernCard>

        {/* Onboarding Analysis Test Section */}
        {user?.isOnboardingComplete && user?.carePersonEmail && (
          <ModernCard variant='elevated' style={styles.section}>
            <ThemedText type='heading' style={styles.sectionTitle}>
              🧪 Testing & Development
            </ThemedText>
            <OnboardingAnalysisTest />
          </ModernCard>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol
            size={20}
            name='rectangle.portrait.and.arrow.right'
            color={Colors.dark.danger}
          />
          <ThemedText type='body' style={styles.logoutText}>
            Log Out
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Increased to account for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },
  userStatusCard: {
    marginBottom: 20,
  },
  userStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.dark.success,
  },
  userStatusSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  emergencyContactCard: {
    marginBottom: 20,
  },
  emergencyContactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.dark.warning,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  carePersonCard: {
    marginBottom: 20,
  },
  carePersonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.dark.secondary,
  },
  carePersonEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  carePersonSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  preferencesCard: {
    marginBottom: 20,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.dark.primary,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.dark.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.danger,
  },
});
