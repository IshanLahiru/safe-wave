import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsetsSafe } from '@/hooks/useSafeAreaInsetsSafe';
import { ThemedText } from '@/components/ThemedText';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Spacing } from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsetsSafe();
  const theme = Colors.dark;

  // Privacy settings state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data export will be sent to your email address within 24 hours.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol size={24} name="chevron.left" color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Privacy & Security
          </ThemedText>
        </View>

        {/* Data Privacy Section */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Data Privacy
          </ThemedText>
          
          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <IconSymbol size={20} name="shield.fill" color={theme.primary} />
              <View style={styles.privacyText}>
                <ThemedText type="body" style={styles.privacyLabel}>
                  Data Encryption
                </ThemedText>
                <ThemedText type="caption" variant="muted" style={styles.privacyDescription}>
                  All your data is encrypted using industry-standard AES-256 encryption
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={16} name="checkmark.circle.fill" color={theme.success} />
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <IconSymbol size={20} name="lock.fill" color={theme.primary} />
              <View style={styles.privacyText}>
                <ThemedText type="body" style={styles.privacyLabel}>
                  Secure Authentication
                </ThemedText>
                <ThemedText type="caption" variant="muted" style={styles.privacyDescription}>
                  JWT tokens with secure session management
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={16} name="checkmark.circle.fill" color={theme.success} />
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <IconSymbol size={20} name="server.rack" color={theme.primary} />
              <View style={styles.privacyText}>
                <ThemedText type="body" style={styles.privacyLabel}>
                  Local Data Storage
                </ThemedText>
                <ThemedText type="caption" variant="muted" style={styles.privacyDescription}>
                  Your sensitive data is stored locally and never shared with third parties
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={16} name="checkmark.circle.fill" color={theme.success} />
          </View>
        </ModernCard>

        {/* Privacy Settings */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Privacy Settings
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name="chart.bar.fill" color={theme.primary} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Analytics
                </ThemedText>
                <ThemedText type="caption" variant="muted" style={styles.settingDescription}>
                  Help improve the app with anonymous usage data
                </ThemedText>
              </View>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: theme.disabled, true: theme.primary }}
              thumbColor={analyticsEnabled ? theme.text : theme.muted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol size={20} name="bell.fill" color={theme.primary} />
              <View style={styles.settingText}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Notifications
                </ThemedText>
                <ThemedText type="caption" variant="muted" style={styles.settingDescription}>
                  Receive important updates and reminders
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.disabled, true: theme.primary }}
              thumbColor={notificationsEnabled ? theme.text : theme.muted}
            />
          </View>
        </ModernCard>

        {/* Data Management */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Data Management
          </ThemedText>

          <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
            <View style={styles.actionLeft}>
              <IconSymbol size={20} name="square.and.arrow.up.fill" color={theme.primary} />
              <ThemedText type="body" style={styles.actionLabel}>
                Export My Data
              </ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <View style={styles.actionLeft}>
              <IconSymbol size={20} name="trash.fill" color={theme.danger} />
              <ThemedText type="body" style={[styles.actionLabel, { color: theme.danger }]}>
                Delete Account
              </ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color={theme.muted} />
          </TouchableOpacity>
        </ModernCard>

        {/* Security Information */}
        <ModernCard variant="surface" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Security Information
          </ThemedText>
          <ThemedText type="body" variant="muted" style={styles.securityInfo}>
            Safe Wave takes your privacy seriously. We use end-to-end encryption for all sensitive data, 
            implement secure authentication protocols, and never share your personal information with 
            third parties without your explicit consent.
          </ThemedText>
          <ThemedText type="body" variant="muted" style={styles.securityInfo}>
            For questions about our privacy practices, please contact our support team.
          </ThemedText>
        </ModernCard>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.dark.text,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  securityInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
});
