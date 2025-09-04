import React, { useState } from 'react';
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
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'features' | 'troubleshooting' | 'privacy';
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get started with Safe Wave?',
    answer: 'After creating your account, complete the onboarding questionnaire to personalize your experience. You can then start using features like daily check-ins, medical document storage, and audio analysis.',
    category: 'getting-started',
  },
  {
    id: '2',
    question: 'What is the daily check-in feature?',
    answer: 'Daily check-ins help you track your mental health over time. Answer a few quick questions about your mood, stress levels, and overall wellbeing. This data helps identify patterns and triggers.',
    category: 'features',
  },
  {
    id: '3',
    question: 'How does audio analysis work?',
    answer: 'Our AI-powered audio analysis uses speech patterns and content to assess mental health indicators. Your audio is processed securely and privately, with results shared only with your designated care person if needed.',
    category: 'features',
  },
  {
    id: '4',
    question: 'Can I store medical documents securely?',
    answer: 'Yes! Upload and organize your medical documents, prescriptions, and health records. All files are encrypted and stored securely on your device and our secure servers.',
    category: 'features',
  },
  {
    id: '5',
    question: 'Who can see my data?',
    answer: 'Your data is private by default. Only you and your designated care person (if you choose to add one) can access your information. We never share data with third parties without your explicit consent.',
    category: 'privacy',
  },
  {
    id: '6',
    question: 'What if I need immediate help?',
    answer: 'If you\'re in crisis, please contact emergency services immediately. Safe Wave also provides quick access to mental health resources and can alert your care person in urgent situations.',
    category: 'troubleshooting',
  },
  {
    id: '7',
    question: 'How do I add a care person?',
    answer: 'Go to your profile settings and add a trusted contact as your care person. They\'ll receive important alerts and can help support your mental health journey.',
    category: 'getting-started',
  },
  {
    id: '8',
    question: 'Why isn\'t my audio analysis working?',
    answer: 'Make sure you have a stable internet connection and have granted microphone permissions. Audio files should be clear and at least 30 seconds long for best results.',
    category: 'troubleshooting',
  },
];

export default function HelpFAQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsetsSafe();
  const theme = Colors.dark;
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All', icon: 'list.bullet' },
    { id: 'getting-started', label: 'Getting Started', icon: 'play.circle.fill' },
    { id: 'features', label: 'Features', icon: 'star.fill' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: 'wrench.fill' },
    { id: 'privacy', label: 'Privacy', icon: 'lock.fill' },
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@safewave.app?subject=Support Request');
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
            Help & FAQ
          </ThemedText>
        </View>

        {/* Quick Help */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Quick Help
          </ThemedText>
          
          <TouchableOpacity style={styles.quickHelpItem} onPress={handleContactSupport}>
            <View style={styles.quickHelpLeft}>
              <IconSymbol size={20} name="envelope.fill" color={theme.primary} />
              <ThemedText type="body" style={styles.quickHelpLabel}>
                Contact Support
              </ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickHelpItem} 
            onPress={() => Linking.openURL('tel:988')}
          >
            <View style={styles.quickHelpLeft}>
              <IconSymbol size={20} name="phone.fill" color={theme.danger} />
              <ThemedText type="body" style={styles.quickHelpLabel}>
                Crisis Hotline (988)
              </ThemedText>
            </View>
            <IconSymbol size={16} name="arrow.up.right" color={theme.muted} />
          </TouchableOpacity>
        </ModernCard>

        {/* Category Filter */}
        <ModernCard variant="surface" style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <IconSymbol 
                    size={16} 
                    name={category.icon} 
                    color={selectedCategory === category.id ? theme.background : theme.primary} 
                  />
                  <ThemedText 
                    type="caption" 
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category.id && styles.categoryLabelActive
                    ]}
                  >
                    {category.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </ModernCard>

        {/* FAQ Items */}
        <ModernCard variant="elevated" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Frequently Asked Questions
          </ThemedText>
          
          {filteredFAQs.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => toggleExpanded(item.id)}
              >
                <View style={styles.faqHeader}>
                  <ThemedText type="body" style={styles.faqQuestion}>
                    {item.question}
                  </ThemedText>
                  <IconSymbol
                    size={16}
                    name={expandedItems.has(item.id) ? "chevron.up" : "chevron.down"}
                    color={theme.muted}
                  />
                </View>
              </TouchableOpacity>
              
              {expandedItems.has(item.id) && (
                <View style={styles.faqAnswer}>
                  <ThemedText type="body" variant="muted" style={styles.faqAnswerText}>
                    {item.answer}
                  </ThemedText>
                </View>
              )}
              
              {index < filteredFAQs.length - 1 && <View style={styles.faqDivider} />}
            </View>
          ))}
        </ModernCard>

        {/* Additional Resources */}
        <ModernCard variant="surface" style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Additional Resources
          </ThemedText>
          <ThemedText type="body" variant="muted" style={styles.resourceText}>
            For more detailed information, visit our website or contact our support team. 
            We're here to help you make the most of Safe Wave.
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
  quickHelpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  quickHelpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickHelpLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  categoryLabel: {
    marginLeft: Spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.primary,
  },
  categoryLabelActive: {
    color: Colors.dark.background,
  },
  faqItem: {
    paddingVertical: Spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: Spacing.md,
  },
  faqAnswer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  faqDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.sm,
  },
  resourceText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
