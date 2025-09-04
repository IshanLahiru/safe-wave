import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsetsSafe } from '@/hooks/useSafeAreaInsetsSafe';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';

type FeedbackCategory = 'bug' | 'feature' | 'general' | 'compliment';

interface FeedbackOption {
  id: FeedbackCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const feedbackOptions: FeedbackOption[] = [
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Report a problem or issue',
    icon: 'exclamationmark.triangle.fill',
    color: Colors.dark.danger,
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    icon: 'lightbulb.fill',
    color: Colors.dark.warning,
  },
  {
    id: 'general',
    label: 'General Feedback',
    description: 'Share your thoughts or suggestions',
    icon: 'message.fill',
    color: Colors.dark.primary,
  },
  {
    id: 'compliment',
    label: 'Compliment',
    description: 'Share what you love about the app',
    icon: 'heart.fill',
    color: Colors.dark.success,
  },
];

export default function SendFeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsetsSafe();
  const { user } = useUser();
  const theme = Colors.dark;

  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a feedback category.');
      return;
    }

    if (!feedbackText.trim()) {
      Alert.alert('Feedback Required', 'Please enter your feedback.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Feedback Sent!',
        'Thank you for your feedback. We\'ll review it and get back to you if needed.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = feedbackOptions.find(option => option.id === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              Send Feedback
            </ThemedText>
          </View>

          {/* Feedback Categories */}
          <ModernCard variant="elevated" style={styles.section}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              What type of feedback do you have?
            </ThemedText>
            
            {feedbackOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.categoryOption,
                  selectedCategory === option.id && styles.categoryOptionSelected
                ]}
                onPress={() => setSelectedCategory(option.id)}
              >
                <View style={styles.categoryLeft}>
                  <IconSymbol size={20} name={option.icon} color={option.color} />
                  <View style={styles.categoryText}>
                    <ThemedText type="body" style={styles.categoryLabel}>
                      {option.label}
                    </ThemedText>
                    <ThemedText type="caption" variant="muted" style={styles.categoryDescription}>
                      {option.description}
                    </ThemedText>
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedCategory === option.id && styles.radioButtonSelected
                ]}>
                  {selectedCategory === option.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ModernCard>

          {/* Feedback Form */}
          {selectedCategory && (
            <ModernCard variant="elevated" style={styles.section}>
              <View style={styles.formHeader}>
                <IconSymbol size={20} name={selectedOption!.icon} color={selectedOption!.color} />
                <ThemedText type="heading" style={styles.formTitle}>
                  {selectedOption!.label}
                </ThemedText>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Your Feedback *
                </ThemedText>
                <TextInput
                  style={styles.textArea}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder={`Tell us about your ${selectedOption!.label.toLowerCase()}...`}
                  placeholderTextColor={theme.muted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Contact Email (Optional)
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor={theme.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <ThemedText type="caption" variant="muted" style={styles.inputHint}>
                  We'll only use this to follow up on your feedback if needed
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedCategory || !feedbackText.trim() || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!selectedCategory || !feedbackText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ThemedText type="body" style={styles.submitButtonText}>
                    Sending...
                  </ThemedText>
                ) : (
                  <>
                    <IconSymbol size={16} name="paperplane.fill" color={theme.background} />
                    <ThemedText type="body" style={styles.submitButtonText}>
                      Send Feedback
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </ModernCard>
          )}

          {/* Help Text */}
          <ModernCard variant="surface" style={styles.section}>
            <ThemedText type="body" variant="muted" style={styles.helpText}>
              Your feedback helps us improve Safe Wave. We read every submission and use your 
              input to make the app better for everyone.
            </ThemedText>
          </ModernCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  keyboardView: {
    flex: 1,
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
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryOptionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surface,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.dark.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    color: Colors.dark.text,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    color: Colors.dark.text,
  },
  textInput: {
    backgroundColor: Colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 44,
  },
  textArea: {
    backgroundColor: Colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 120,
  },
  inputHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark.disabled,
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
