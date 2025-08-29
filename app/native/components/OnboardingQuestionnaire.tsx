import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/contexts/UserContext';

interface Question {
    id: string;
    text: string;
    type: 'multiple-choice' | 'scale' | 'text';
    options?: string[];
    scaleRange?: { min: number; max: number; labels: string[] };
}

const QUESTIONS: Question[] = [
    {
        id: 'safety_concerns',
        text: 'Do you have any current safety concerns?',
        type: 'multiple-choice',
        options: ['None at the moment', 'Some concerns', 'Significant concerns', 'Prefer not to say']
    },
    {
        id: 'support_system',
        text: 'How would you describe your current support system?',
        type: 'multiple-choice',
        options: ['Very strong', 'Somewhat strong', 'Limited', 'I need help building one']
    },
    {
        id: 'crisis_plan',
        text: 'Do you have a crisis safety plan?',
        type: 'multiple-choice',
        options: ['Yes, I have one', 'I have some ideas', 'No, I need help creating one', 'What is a crisis plan?']
    },
    {
        id: 'daily_struggles',
        text: 'What are your biggest daily struggles?',
        type: 'text'
    },
    {
        id: 'coping_mechanisms',
        text: 'What coping mechanisms work best for you?',
        type: 'text'
    },
    {
        id: 'stress_level',
        text: 'How would you rate your current stress level?',
        type: 'scale',
        scaleRange: {
            min: 1,
            max: 10,
            labels: ['Very Low', 'Very High']
        }
    },
    {
        id: 'sleep_quality',
        text: 'How would you rate your sleep quality?',
        type: 'scale',
        scaleRange: {
            min: 1,
            max: 10,
            labels: ['Very Poor', 'Excellent']
        }
    },
    {
        id: 'app_goals',
        text: 'What do you hope to achieve with this app?',
        type: 'text'
    },
    {
        id: 'checkin_frequency',
        text: 'How often would you like to check in?',
        type: 'multiple-choice',
        options: ['Daily', 'Every other day', 'Weekly', 'As needed', 'I\'m not sure yet']
    },
    {
        id: 'emergency_contact_name',
        text: 'What is your emergency contact\'s full name?',
        type: 'text'
    },
    {
        id: 'emergency_contact_email',
        text: 'What is your emergency contact\'s email address?',
        type: 'text'
    },
    {
        id: 'emergency_contact_relationship',
        text: 'What is your relationship to this emergency contact?',
        type: 'multiple-choice',
        options: ['Family member', 'Friend', 'Therapist/Counselor', 'Doctor/Healthcare provider', 'Other']
    }
];

export default function OnboardingQuestionnaire() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { user, completeOnboarding } = useUser();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [textInputs, setTextInputs] = useState<Record<string, string>>({});

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    const handleAnswer = (answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer
        }));
    };



    const isAnswerValid = () => {
        const currentQuestion = QUESTIONS[currentQuestionIndex];

        if (currentQuestion.type === 'text') {
            // For text questions, check if there's text input
            return textInputs[currentQuestion.id] && textInputs[currentQuestion.id].trim().length > 0;
        } else if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'scale') {
            // For multiple choice and scale questions, check if an answer is selected
            return answers[currentQuestion.id] !== undefined;
        }

        return false;
    };

    const handleTextInputChange = (questionId: string, text: string) => {
        setTextInputs(prev => ({
            ...prev,
            [questionId]: text
        }));
    };

    const handleBackNavigation = () => {
        // Check if user came from profile (onboarding incomplete)
        if (!user?.isOnboardingComplete) {
            // Go back to profile
            router.replace('/(tabs)/profile');
        } else {
            // Go back to previous screen
            router.back();
        }
    };

    const handleCloseQuestionnaire = () => {
        // Always return to profile when closing questionnaire
        router.replace('/(tabs)/profile');
    };

    const handleNext = () => {
        if (currentQuestion.type === 'text' && !textInputs[currentQuestion.id]?.trim()) {
            Alert.alert('Please provide an answer', 'This question requires a response before continuing.');
            return;
        }

        if (isLastQuestion) {
            // Save answers and navigate back
            handleComplete();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstQuestion) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        // Validate emergency contact information
        const emergencyContactName = textInputs['emergency_contact_name']?.trim();
        const emergencyContactEmail = textInputs['emergency_contact_email']?.trim();
        const emergencyContactRelationship = answers['emergency_contact_relationship'];

        if (!emergencyContactName || !emergencyContactEmail || !emergencyContactRelationship) {
            Alert.alert(
                'Emergency Contact Required',
                'Please provide complete emergency contact information including name, email address, and relationship before completing the questionnaire.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Save all answers to user context
        const allAnswers = { ...answers, ...textInputs };
        completeOnboarding(allAnswers);

        Alert.alert(
            'Welcome to Safe Wave! 🌊',
            'Your onboarding is complete! Your emergency contact information has been saved for your safety.',
            [
                {
                    text: 'Get Started',
                    onPress: () => router.replace('/(tabs)')
                }
            ]
        );
    };

    const renderQuestion = () => {
        switch (currentQuestion.type) {
            case 'multiple-choice':
                return (
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options?.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    answers[currentQuestion.id] === option && styles.selectedOption
                                ]}
                                onPress={() => handleAnswer(option)}
                            >
                                <ThemedText style={[
                                    styles.optionText,
                                    answers[currentQuestion.id] === option && styles.selectedOptionText
                                ]}>
                                    {option}
                                </ThemedText>
                                {answers[currentQuestion.id] === option && (
                                    <IconSymbol size={20} name="checkmark.circle.fill" color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                );

            case 'scale':
                const { min, max, labels } = currentQuestion.scaleRange!;
                return (
                    <View style={styles.scaleContainer}>
                        <View style={styles.scaleLabels}>
                            <ThemedText style={styles.scaleLabel}>{labels[0]}</ThemedText>
                            <ThemedText style={styles.scaleLabel}>{labels[1]}</ThemedText>
                        </View>
                        <View style={styles.scaleButtons}>
                            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((value) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[
                                        styles.scaleButton,
                                        answers[currentQuestion.id] === value && styles.selectedScaleButton
                                    ]}
                                    onPress={() => handleAnswer(value)}
                                >
                                    <ThemedText style={[
                                        styles.scaleButtonText,
                                        answers[currentQuestion.id] === value && styles.selectedScaleButtonText
                                    ]}>
                                        {value}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'text':
                return (
                    <ThemedView style={styles.textInputContainer}>
                        <ThemedText style={styles.textInputLabel}>
                            Please share your thoughts:
                        </ThemedText>
                        <TextInput
                            style={[
                                styles.textInputField,
                                textInputs[currentQuestion.id] && styles.textInputFieldFocused
                            ]}
                            value={textInputs[currentQuestion.id] || ''}
                            onChangeText={(text) => handleTextInputChange(currentQuestion.id, text)}
                            placeholder="Share your thoughts, experiences, or concerns..."
                            placeholderTextColor="#8E8E93"
                            multiline={true}
                            textAlignVertical="top"
                            autoFocus={false}
                            selectionColor="#007AFF"
                            cursorColor="#007AFF"
                        />
                    </ThemedView>
                );

            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* Header */}
            <ThemedView style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
                    <IconSymbol size={24} name="chevron.left" color={theme.tint} />
                    <ThemedText style={styles.backButtonText}>Back</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={handleCloseQuestionnaire}>
                    <IconSymbol size={24} name="xmark" color={theme.tint} />
                </TouchableOpacity>

                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title" style={styles.headerTitle}>
                        🌊 Welcome to Safe Wave
                    </ThemedText>
                    <ThemedText style={styles.headerSubtitle}>
                        Let's get to know you better
                    </ThemedText>
                </ThemedView>
            </ThemedView>

            {/* Progress Bar */}
            <ThemedView style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }
                        ]}
                    />
                </View>
                <ThemedText style={styles.progressText}>
                    {currentQuestionIndex + 1} of {QUESTIONS.length}
                </ThemedText>
            </ThemedView>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* Emergency Contact Notice */}
                {(currentQuestion.id === 'emergency_contact_name' ||
                    currentQuestion.id === 'emergency_contact_email' ||
                    currentQuestion.id === 'emergency_contact_relationship') && (
                        <ThemedView style={styles.emergencyNotice}>
                            <ThemedText style={styles.emergencyNoticeText}>
                                ⚠️ Emergency contact information is required for your safety
                            </ThemedText>
                        </ThemedView>
                    )}

                {/* Question */}
                <ThemedView style={styles.questionContainer}>
                    <ThemedText type="title" style={styles.questionText}>
                        {currentQuestion.text}
                    </ThemedText>
                </ThemedView>

                {/* Answer Options */}
                {renderQuestion()}

                {/* Add extra padding at bottom for keyboard */}
                <View style={styles.keyboardSpacer} />
            </ScrollView>

            {/* Navigation Buttons */}
            <ThemedView style={[
                styles.navigationContainer,
                { paddingBottom: Math.max(insets.bottom + 20, 40) }
            ]}>
                {!isFirstQuestion && (
                    <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                        <IconSymbol size={20} name="chevron.left" color={theme.tint} />
                        <ThemedText style={styles.previousButtonText}>Previous</ThemedText>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        (!isAnswerValid()) && styles.disabledButton
                    ]}
                    onPress={handleNext}
                    disabled={!isAnswerValid()}
                >
                    <ThemedText style={styles.nextButtonText}>
                        {isLastQuestion ? 'Complete' : 'Next'}
                    </ThemedText>
                    {!isLastQuestion && (
                        <IconSymbol size={20} name="chevron.right" color="white" />
                    )}
                </TouchableOpacity>
            </ThemedView>


        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 15,
        margin: 20,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        zIndex: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 4,
        opacity: 0.8,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    titleContainer: {
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        textAlign: 'center',
        opacity: 0.7,
    },
    progressContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 15,
        margin: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 3,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
        opacity: 0.7,
    },
    content: {
        flex: 1,
        padding: 20,
        paddingBottom: 120, // Add space for navigation buttons
    },
    scrollContent: {
        paddingBottom: 40, // Extra padding for keyboard
    },
    questionContainer: {
        marginBottom: 25,
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        borderWidth: 0,
        borderColor: 'transparent',
        width: '100%',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
        textAlign: 'left',
        marginBottom: 24,
        color: '#1C1C1E',
        letterSpacing: -0.3,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        minHeight: 56,
    },
    selectedOption: {
        borderColor: '#007AFF',
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
    },
    optionText: {
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
    },
    selectedOptionText: {
        fontWeight: '600',
        color: '#007AFF',
    },
    scaleContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    scaleLabel: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
        opacity: 0.7,
    },
    scaleButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    scaleButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedScaleButton: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    scaleButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    selectedScaleButtonText: {
        color: 'white',
    },
    textInputContainer: {
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        borderWidth: 0,
        borderColor: 'transparent',
        width: '100%',
        marginBottom: 20,
    },
    textInputLabel: {
        fontSize: 16,
        marginBottom: 15,
        fontWeight: '600',
        textAlign: 'left',
        opacity: 0.9,
        color: '#1C1C1E',
        letterSpacing: -0.2,
    },

    textInputField: {
        width: '100%',
        minHeight: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'left',
        color: '#000000',
        textAlignVertical: 'top',
        fontWeight: '400',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    textInputFieldFocused: {
        borderColor: '#007AFF',
        borderWidth: 2,
        shadowColor: '#007AFF',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 15,
        margin: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    previousButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    previousButtonText: {
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '500',
        opacity: 0.7,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        gap: 8,
        minWidth: 100,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#687076',
    },

    emergencyNotice: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 193, 7, 0.3)',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    keyboardSpacer: {
        height: 100, // Space for keyboard
    },

    emergencyNoticeText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 20,
    },
});
