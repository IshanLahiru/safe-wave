import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文 (Chinese)' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [language, setLanguage] = useState('en');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
          <ThemedView style={styles.avatarContainer}>
            <IconSymbol size={60} name="person.fill" color="white" />
          </ThemedView>
          <ThemedView style={styles.profileInfo}>
            <ThemedText type="title" style={styles.profileName}>Ishan Lahiru</ThemedText>
            <ThemedText style={styles.profileEmail}>ishan.lahiru@email.com</ThemedText>
            <ThemedText style={styles.profileRole}>Healthcare Provider</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Quick Stats */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>24</ThemedText>
            <ThemedText style={styles.statLabel}>Check-ins</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>7</ThemedText>
            <ThemedText style={styles.statLabel}>This Week</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>98%</ThemedText>
            <ThemedText style={styles.statLabel}>Completion</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Settings Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Preferences</ThemedText>

          <ThemedView style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="moon.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
            </ThemedView>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor={darkMode ? '#007AFF' : '#eee'}
              trackColor={{ true: 'rgba(0, 122, 255, 0.3)', false: '#ccc' }}
            />
          </ThemedView>

          <ThemedView style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="globe" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Language</ThemedText>
            </ThemedView>
            <ThemedView style={styles.languageSelector}>
              {LANGUAGES.map(l => (
                <TouchableOpacity
                  key={l.code}
                  style={[
                    styles.languageButton,
                    language === l.code && { backgroundColor: '#007AFF' }
                  ]}
                  onPress={() => setLanguage(l.code)}
                >
                  <ThemedText style={[
                    styles.languageButtonText,
                    language === l.code && { color: 'white' }
                  ]}>
                    {l.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Account Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Account</ThemedText>

          <TouchableOpacity style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="person.circle.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Edit Profile</ThemedText>
            </ThemedView>
            <IconSymbol size={16} name="chevron.right" color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol size={20} name="bell.fill" color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
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
        <TouchableOpacity style={styles.logoutButton}>
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
    paddingBottom: 40,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    gap: 8,
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
  languageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageButtonText: {
    fontSize: 14,
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
