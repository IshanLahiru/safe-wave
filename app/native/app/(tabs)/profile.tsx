import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/contexts/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user, logout } = useUser();
  const insets = useSafeAreaInsets();

  const handleOnboardingQuestionnaire = () => {
    router.push('/onboarding-questionnaire');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            console.log('Logout confirmed');
            logout();
          },
        },
      ]
    );
  };

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
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
          <ThemedView style={styles.avatarContainer}>
            <IconSymbol size={60} name="person.fill" color="white" />
          </ThemedView>
          <ThemedView style={styles.profileInfo}>
            <ThemedText type="title" style={styles.profileName}>{user?.name || 'User'}</ThemedText>
            <ThemedText style={styles.profileEmail}>{user?.email || 'user@example.com'}</ThemedText>
            <ThemedText style={styles.profileRole}>{user?.role === 'healthcare_provider' ? 'Healthcare Provider' : 'User'}</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* User Status */}
        <ThemedView style={styles.userStatusCard}>
          <ThemedText type="subtitle" style={styles.userStatusTitle}>
            {user?.isOnboardingComplete ? '✅ Onboarding Complete' : '⏳ Onboarding Pending'}
          </ThemedText>
          <ThemedText style={styles.userStatusSubtitle}>
            {user?.isOnboardingComplete
              ? 'You\'re all set up and ready to use the app!'
              : 'Complete the onboarding questionnaire to get started'
            }
          </ThemedText>
        </ThemedView>

        {/* Emergency Contact Info */}
        {user?.emergencyContact && (
          <ThemedView style={styles.emergencyContactCard}>
            <ThemedText type="subtitle" style={styles.emergencyContactTitle}>
              🚨 Emergency Contact
            </ThemedText>
            <ThemedView style={styles.contactInfo}>
              <ThemedText style={styles.contactLabel}>Name:</ThemedText>
              <ThemedText style={styles.contactValue}>{user.emergencyContact.name}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.contactInfo}>
              <ThemedText style={styles.contactLabel}>Email:</ThemedText>
              <ThemedText style={styles.contactValue}>{user.emergencyContact.email}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.contactInfo}>
              <ThemedText style={styles.contactLabel}>Relationship:</ThemedText>
              <ThemedText style={styles.contactValue}>{user.emergencyContact.relationship}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* Care Person Info */}
        {user?.carePersonEmail && (
          <ThemedView style={styles.carePersonCard}>
            <ThemedText type="subtitle" style={styles.carePersonTitle}>
              👥 Care Person
            </ThemedText>
            <ThemedText style={styles.carePersonEmail}>{user.carePersonEmail}</ThemedText>
            <ThemedText style={styles.carePersonSubtitle}>
              This person will be notified of your check-ins and any concerns
            </ThemedText>
          </ThemedView>
        )}

        {/* User Preferences */}
        {user?.preferences && (
          <ThemedView style={styles.preferencesCard}>
            <ThemedText type="subtitle" style={styles.preferencesTitle}>
              ⚙️ Preferences
            </ThemedText>
            <ThemedView style={styles.preferenceItem}>
              <ThemedText style={styles.preferenceLabel}>Check-in Frequency:</ThemedText>
              <ThemedText style={styles.preferenceValue}>{user.preferences.checkinFrequency}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.preferenceItem}>
              <ThemedText style={styles.preferenceLabel}>Dark Mode:</ThemedText>
              <ThemedText style={styles.preferenceValue}>{user.preferences.darkMode ? 'Enabled' : 'Disabled'}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.preferenceItem}>
              <ThemedText style={styles.preferenceLabel}>Language:</ThemedText>
              <ThemedText style={styles.preferenceValue}>{user.preferences.language.toUpperCase()}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* Account Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Account</ThemedText>

          <TouchableOpacity style={styles.settingRow} onPress={handleOnboardingQuestionnaire}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="doc.text.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Onboarding Questionnaire</ThemedText>
            </ThemedView>
            <IconSymbol size={16} name="chevron.right" color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="lock.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Privacy & Security</ThemedText>
            </ThemedView>
            <IconSymbol size={16} name="chevron.right" color="#999" />
          </TouchableOpacity>
        </ThemedView>

        {/* Support Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Support</ThemedText>

          <TouchableOpacity style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="questionmark.circle.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Help & FAQ</ThemedText>
            </ThemedView>
            <IconSymbol size={16} name="chevron.right" color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="envelope.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Send Feedback</ThemedText>
            </ThemedView>
            <IconSymbol size={16} name="chevron.right" color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="info.circle.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>About</ThemedText>
            </ThemedView>
            <IconSymbol size={16} name="chevron.right" color="#999" />
          </TouchableOpacity>
        </ThemedView>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol size={20} name="rectangle.portrait.and.arrow.right" color="#FF3B30" />
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 16,
    opacity: 0.7,
  },
  profileRole: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  userStatusCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.1)',
  },
  userStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34C759',
  },
  userStatusSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  emergencyContactCard: {
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  emergencyContactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#FF9500',
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
    backgroundColor: 'rgba(88, 86, 214, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.1)',
  },
  carePersonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#5856D6',
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
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#007AFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#007AFF',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
