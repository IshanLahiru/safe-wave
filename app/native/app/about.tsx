import React from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsetsSafe } from '@/hooks/useSafeAreaInsetsSafe';
import { ThemedText } from '@/components/ThemedText';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type { ComponentProps } from 'react';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';

const APP_VERSION = '2.0.0';
const BUILD_NUMBER = '2025.01.04';

interface TeamMember {
  name: string;
  role: string;
  icon: ComponentProps<typeof IconSymbol>['name'];
}

const teamMembers: TeamMember[] = [
  { name: 'Development Team', role: 'Full-Stack Development', icon: 'laptopcomputer' },
  { name: 'AI Research Team', role: 'Machine Learning & NLP', icon: 'brain.head.profile' },
  { name: 'Mental Health Advisors', role: 'Clinical Guidance', icon: 'heart.text.square' },
  { name: 'UX/UI Design Team', role: 'User Experience Design', icon: 'paintbrush.pointed' },
];

interface LegalLink {
  title: string;
  description: string;
  icon: ComponentProps<typeof IconSymbol>['name'];
  action: () => void;
}

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsetsSafe();
  const theme = Colors.dark;

  const legalLinks: LegalLink[] = [
    {
      title: 'Privacy Policy',
      description: 'How we protect and use your data',
      icon: 'doc.text.fill',
      action: () => Linking.openURL('https://safewave.app/privacy'),
    },
    {
      title: 'Terms of Service',
      description: 'Terms and conditions of use',
      icon: 'doc.plaintext.fill',
      action: () => Linking.openURL('https://safewave.app/terms'),
    },
    {
      title: 'Open Source Licenses',
      description: 'Third-party libraries and licenses',
      icon: 'chevron.left.forwardslash.chevron.right',
      action: () => {
        // In a real app, this would show a detailed licenses screen
        Linking.openURL('https://safewave.app/licenses');
      },
    },
  ];

  const handleWebsite = () => {
    Linking.openURL('https://safewave.app');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@safewave.app');
  };

  const handleGitHub = () => {
    Linking.openURL('https://github.com/safewave/app');
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
            About
          </ThemedText>
        </View>

        {/* App Info */}
        <ModernCard variant="elevated" style={styles.section}>
          <View style={styles.appHeader}>
            <View style={styles.appIcon}>
              <IconSymbol size={48} name="heart.fill" color={theme.primary} />
            </View>
            <View style={styles.appInfo}>
              <ThemedText type="title" style={styles.appName}>
                Safe Wave
              </ThemedText>
              <ThemedText type="body" variant="muted" style={styles.appTagline}>
                Mental Health Companion
              </ThemedText>
              <ThemedText type="caption" variant="muted" style={styles.appVersion}>
                Version {APP_VERSION} (Build {BUILD_NUMBER})
              </ThemedText>
            </View>
          </View>
          
          <ThemedText type="body" variant="muted" style={styles.appDescription}>
            Safe Wave is a comprehensive mental health companion app that helps you track your 
            wellbeing, store important medical documents, and stay connected with your care network. 
            Our AI-powered features provide insights while keeping your privacy and security as our top priority.
          </ThemedText>
        </ModernCard>

        {/* Features */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Key Features
          </ThemedText>
          
          <View style={styles.featureItem}>
            <IconSymbol size={20} name="chart.line.uptrend.xyaxis" color={theme.primary} />
            <ThemedText type="body" style={styles.featureText}>
              Daily mood and wellness tracking
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol size={20} name="waveform" color={theme.primary} />
            <ThemedText type="body" style={styles.featureText}>
              AI-powered audio analysis for mental health insights
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol size={20} name="doc.fill" color={theme.primary} />
            <ThemedText type="body" style={styles.featureText}>
              Secure medical document storage
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol size={20} name="person.2.fill" color={theme.primary} />
            <ThemedText type="body" style={styles.featureText}>
              Care person integration and emergency alerts
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol size={20} name="lock.shield.fill" color={theme.primary} />
            <ThemedText type="body" style={styles.featureText}>
              End-to-end encryption and privacy protection
            </ThemedText>
          </View>
        </ModernCard>

        {/* Team */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Our Team
          </ThemedText>
          
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <IconSymbol size={20} name={member.icon} color={theme.primary} />
              <View style={styles.teamMemberInfo}>
                <ThemedText type="body" style={styles.teamMemberName}>
                  {member.name}
                </ThemedText>
                <ThemedText type="caption" variant="muted" style={styles.teamMemberRole}>
                  {member.role}
                </ThemedText>
              </View>
            </View>
          ))}
        </ModernCard>

        {/* Links */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Links & Resources
          </ThemedText>
          
          <TouchableOpacity style={styles.linkItem} onPress={handleWebsite}>
            <View style={styles.linkLeft}>
              <IconSymbol size={20} name="globe" color={theme.primary} />
              <ThemedText type="body" style={styles.linkText}>
                Website
              </ThemedText>
            </View>
            <IconSymbol size={16} name="arrow.up.right" color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem} onPress={handleSupport}>
            <View style={styles.linkLeft}>
              <IconSymbol size={20} name="envelope.fill" color={theme.primary} />
              <ThemedText type="body" style={styles.linkText}>
                Support
              </ThemedText>
            </View>
            <IconSymbol size={16} name="arrow.up.right" color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem} onPress={handleGitHub}>
            <View style={styles.linkLeft}>
              <IconSymbol size={20} name="chevron.left.forwardslash.chevron.right" color={theme.primary} />
              <ThemedText type="body" style={styles.linkText}>
                Open Source
              </ThemedText>
            </View>
            <IconSymbol size={16} name="arrow.up.right" color={theme.muted} />
          </TouchableOpacity>
        </ModernCard>

        {/* Legal */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Legal & Compliance
          </ThemedText>
          
          {legalLinks.map((link, index) => (
            <TouchableOpacity key={index} style={styles.legalItem} onPress={link.action}>
              <View style={styles.legalLeft}>
                <IconSymbol size={20} name={link.icon} color={theme.primary} />
                <View style={styles.legalText}>
                  <ThemedText type="body" style={styles.legalTitle}>
                    {link.title}
                  </ThemedText>
                  <ThemedText type="caption" variant="muted" style={styles.legalDescription}>
                    {link.description}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={16} name="arrow.up.right" color={theme.muted} />
            </TouchableOpacity>
          ))}
        </ModernCard>

        {/* Copyright */}
        <ModernCard variant="surface" style={styles.section}>
          <ThemedText type="caption" variant="muted" style={styles.copyright}>
            © 2025 Safe Wave. All rights reserved.
          </ThemedText>
          <ThemedText type="caption" variant="muted" style={styles.copyright}>
            Made with ❤️ for mental health awareness
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
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  appTagline: {
    fontSize: 16,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
  },
  appDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    marginLeft: Spacing.md,
    flex: 1,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  teamMemberInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  teamMemberRole: {
    fontSize: 14,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  legalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legalText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  legalDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
});
