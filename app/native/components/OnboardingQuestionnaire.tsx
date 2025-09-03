import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    View,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// Add error boundary for DocumentPicker
const safeDocumentPicker = {
    getDocumentAsync: async (options: any) => {
        try {
            console.log('📁 DocumentPicker called with options:', options);
            const result = await DocumentPicker.getDocumentAsync(options);
            console.log('📁 DocumentPicker result:', result);
            return result;
        } catch (error) {
            console.error('❌ DocumentPicker error:', error);
            throw error;
        }
    }
};
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ModernCard } from '@/components/ui/ModernCard';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';

interface Question {
    id: string;
    text: string;
    type: 'multiple-choice' | 'scale' | 'text' | 'file';
    options?: string[];
    scaleRange?: { min: number; max: number; labels: string[] };
}

const QUESTIONS: Question[] = [
    {
        id: 'user_full_name',
        text: 'What is your full name?',
        type: 'text',
    },
    {
        id: 'safety_concerns',
        text: 'Do you have any current safety concerns?',
        type: 'multiple-choice',
        options: ['None at the moment', 'Some concerns', 'Significant concerns', 'Prefer not to say'],
    },
    {
        id: 'support_system',
        text: 'How would you describe your current support system?',
        type: 'multiple-choice',
        options: ['Very strong', 'Somewhat strong', 'Limited', 'I need help building one'],
    },
    {
        id: 'crisis_plan',
        text: 'Do you have a crisis safety plan?',
        type: 'multiple-choice',
        options: [
            'Yes, I have one',
            'I have some ideas',
            'No, I need help creating one',
            'What is a crisis plan?',
        ],
    },
    {
        id: 'daily_struggles',
        text: 'What are your biggest daily struggles?',
        type: 'text',
    },
    {
        id: 'coping_mechanisms',
        text: 'What coping mechanisms work best for you?',
        type: 'text',
    },
    {
        id: 'stress_level',
        text: 'How would you rate your current stress level?',
        type: 'scale',
        scaleRange: {
            min: 1,
            max: 10,
            labels: ['Very Low', 'Very High'],
        },
    },
    {
        id: 'sleep_quality',
        text: 'How would you rate your sleep quality?',
        type: 'scale',
        scaleRange: {
            min: 1,
            max: 10,
            labels: ['Very Poor', 'Excellent'],
        },
    },
    {
        id: 'app_goals',
        text: 'What do you hope to achieve with this app?',
        type: 'text',
    },
    {
        id: 'checkin_frequency',
        text: 'How often would you like to check in?',
        type: 'multiple-choice',
        options: ['Daily', 'Every other day', 'Weekly', 'As needed', "I'm not sure yet"],
    },
    {
        id: 'emergency_contact_name',
        text: "What is your emergency contact's full name?",
        type: 'text',
    },
    {
        id: 'emergency_contact_email',
        text: "What is your emergency contact's email address?",
        type: 'text',
    },
    {
        id: 'emergency_contact_relationship',
        text: 'What is your relationship to this emergency contact?',
        type: 'multiple-choice',
        options: [
            'Family member',
            'Friend',
            'Therapist/Counselor',
            'Doctor/Healthcare provider',
            'Other',
        ],
    },
    {
        id: 'mood_frequency',
        text: 'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?',
        type: 'multiple-choice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    },
    {
        id: 'concentration_difficulty',
        text: 'Have you had trouble concentrating on tasks recently?',
        type: 'multiple-choice',
        options: ['Never', 'Sometimes', 'Often', 'Almost always'],
    },
    {
        id: 'physical_symptoms',
        text: 'Have you experienced any of the following physical symptoms recently?',
        type: 'multiple-choice',
        options: ['Headaches', 'Fatigue', 'Changes in appetite', 'Muscle tension', 'None of the above'],
    },
    {
        id: 'reaction_to_stress',
        text: 'When you feel stressed or low, what do you usually do in response?',
        type: 'text',
    },
];

export default function OnboardingQuestionnaire() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = Colors.dark; // Use dark theme consistently
    const { user, completeOnboarding } = useUser();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [textInputs, setTextInputs] = useState<Record<string, string>>({});
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({});
    const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [uploadAbortController, setUploadAbortController] = useState<Record<string, AbortController>>({});
    const [isOnline, setIsOnline] = useState(true);

    const scrollViewRef = useRef<ScrollView>(null);

    // Auto-scroll to active tab when question index changes
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollToActiveTab(currentQuestionIndex);
        }
    }, [currentQuestionIndex]);

    // Test backend connectivity and enable network monitoring on component mount
    useEffect(() => {
        const testConnection = async () => {
            try {
                const { testBackendConnection } = await import('@/services/config');
                const isConnected = await testBackendConnection();
                console.log('🔗 Backend connection test:', isConnected ? '✅ Success' : '❌ Failed');

                if (!isConnected) {
                    console.warn('⚠️ Backend connection failed - uploads may not work');
                }
            } catch (error) {
                console.error('Connection test failed:', error);
            }
        };

        testConnection();
        monitorNetworkRequests(); // Enable network monitoring in development

        // Monitor network connectivity
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            setIsOnline(navigator.onLine);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            }
        };
    }, []);

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    const handleAnswer = (answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer,
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
        } else if (currentQuestion.type === 'file') {
            // For file questions, always allow progression (optional upload)
            return true;
        }

        return false;
    };

    const areAllQuestionsAnswered = () => {
        // Check if all required questions have been answered (excluding optional file uploads)
        for (const question of QUESTIONS) {
            if (question.type === 'text') {
                if (!textInputs[question.id] || !textInputs[question.id].trim()) {
                    return false;
                }
            } else if (question.type === 'multiple-choice' || question.type === 'scale') {
                if (answers[question.id] === undefined) {
                    return false;
                }
            }
            // File questions are optional - skip validation for them
        }
        return true;
    };

    const getCompletedQuestionsCount = () => {
        return QUESTIONS.filter(question => {
            if (question.type === 'text') {
                return textInputs[question.id] && textInputs[question.id].trim().length > 0;
            } else if (question.type === 'multiple-choice' || question.type === 'scale') {
                return answers[question.id] !== undefined;
            } else if (question.type === 'file') {
                // File questions are optional - count as completed regardless of upload status
                return true;
            }
            return false;
        }).length;
    };

    const getCompletionPercentage = () => {
        return (getCompletedQuestionsCount() / QUESTIONS.length) * 100;
    };

    const handleTextInputChange = (questionId: string, text: string) => {
        setTextInputs(prev => ({
            ...prev,
            [questionId]: text,
        }));
    };

    const handleFileUpload = async (questionId: string) => {
        try {
            console.log('🚀 Starting file upload for question:', questionId);

            // Check authentication first
            const token = await apiService.getAccessTokenAsync();
            if (!token) {
                console.error('❌ No authentication token available');
                Alert.alert('Authentication Required', 'Please log in first to upload files.');
                setUploadStatus(prev => ({ ...prev, [questionId]: 'error' }));
                return;
            }

            console.log('✅ Authentication token found, proceeding with upload');

            // Reset progress and status
            setUploadProgress(prev => ({ ...prev, [questionId]: 0 }));
            setUploadStatus(prev => ({ ...prev, [questionId]: 'uploading' }));

            // Create abort controller for this upload
            const abortController = new AbortController();
            setUploadAbortController(prev => ({ ...prev, [questionId]: abortController }));

            // Pick document with enhanced cross-platform support
            const result = await safeDocumentPicker.getDocumentAsync({
                type: Platform.OS === 'web'
                    ? [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'image/*',
                        'text/plain',
                    ]
                    : ['*/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                console.log('❌ File picker was canceled');
                setUploadStatus(prev => ({ ...prev, [questionId]: 'idle' }));
                setUploadProgress(prev => ({ ...prev, [questionId]: 0 }));
                return;
            }

            const file = result.assets[0];
            console.log('📁 Selected file:', {
                name: file.name,
                size: file.size,
                type: file.mimeType,
                uri: file.uri,
                platform: Platform.OS
            });

            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (!file.size) {
                Alert.alert('File Error', 'Could not determine file size. Please try another file.');
                setUploadStatus(prev => ({ ...prev, [questionId]: 'idle' }));
                setUploadProgress(prev => ({ ...prev, [questionId]: 0 }));
                return;
            }

            if (file.size > maxSize) {
                Alert.alert(
                    'File Too Large',
                    `Please select a file smaller than ${maxSize / (1024 * 1024)}MB.`
                );
                setUploadStatus(prev => ({ ...prev, [questionId]: 'idle' }));
                setUploadProgress(prev => ({ ...prev, [questionId]: 0 }));
                return;
            }

            // Create form data with proper cross-platform handling
            const formData = new FormData();

            console.log('📁 Creating FormData for platform:', Platform.OS);
            console.log('📁 File details:', {
                name: file.name,
                size: file.size,
                type: file.mimeType,
                uri: file.uri
            });

            if (Platform.OS === 'web') {
                // Web platform handling
                console.log('🌐 Web platform file handling');
                if (file.uri.startsWith('blob:')) {
                    try {
                        console.log('🔄 Converting blob to file...');
                        const response = await fetch(file.uri);
                        const blob = await response.blob();
                        formData.append('file', blob, file.name);
                        console.log('✅ Blob converted and added to FormData');
                    } catch (blobError) {
                        console.warn('⚠️ Blob handling failed, trying direct file:', blobError);
                        formData.append('file', file as any, file.name);
                        console.log('✅ Direct file added to FormData');
                    }
                } else {
                    console.log('📎 Adding file directly to FormData');
                    formData.append('file', file as any, file.name);
                }
            } else {
                // Mobile platform handling (iOS/Android)
                console.log('📱 Mobile platform file handling');
                const fileToUpload = {
                    uri: file.uri,
                    name: file.name || 'document',
                    type: file.mimeType || 'application/octet-stream',
                };
                console.log('📱 File object for mobile:', fileToUpload);
                formData.append('file', fileToUpload as any);
            }

            console.log('📦 FormData created successfully');
            console.log('📦 FormData entries:', 'FormData created with file');

            // Get dynamic backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();

            console.log('🌐 Uploading to:', baseUrl);

            // Use the token we already got at the beginning of the function
            if (!token) {
                throw new Error('No authentication token available. Please log in again.');
            }

            // Upload with progress tracking and retry logic
            let response: Response | undefined;
            let retryCount = 0;
            const maxRetries = 3;

            let progressInterval: ReturnType<typeof setInterval> | null = null;
            while (retryCount < maxRetries) {
                try {
                    // Simulate progress updates for better UX
                    progressInterval = setInterval(() => {
                        setUploadProgress(prev => {
                            const current = prev[questionId] || 0;
                            if (current < 90) {
                                return { ...prev, [questionId]: current + Math.random() * 10 };
                            }
                            return prev;
                        });
                    }, 200);

                    // Enhanced fetch with better logging for network tab visibility
                    const uploadUrl = `${baseUrl}/documents/onboarding-upload`;
                    console.log('🌐 Starting upload request:', {
                        url: uploadUrl,
                        method: 'POST',
                        fileSize: file.size,
                        fileName: file.name,
                        platform: Platform.OS,
                        timestamp: new Date().toISOString()
                    });

                    // Create a custom fetch that ensures network tab visibility
                    response = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-Upload-Platform': Platform.OS,
                            'X-Upload-File-Name': file.name,
                            'X-Upload-File-Size': file.size.toString(),
                        },
                        body: formData,
                        signal: abortController.signal,
                    });

                    if (progressInterval) clearInterval(progressInterval);
                    setUploadProgress(prev => ({ ...prev, [questionId]: 100 }));

                    console.log('✅ Upload completed with status:', response.status);
                    break; // Success, exit retry loop

                } catch (fetchError) {
                    if (progressInterval) clearInterval(progressInterval);

                    if (abortController.signal.aborted) {
                        console.log('🛑 Upload was aborted');
                        throw new Error('Upload was cancelled');
                    }

                    retryCount++;
                    console.warn(`Upload attempt ${retryCount} failed:`, fetchError);

                    if (retryCount >= maxRetries) {
                        throw fetchError;
                    }

                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }

            if (!response || !response.ok) {
                const errorText = response ? await response.text() : 'No response received';
                const status = response?.status || 'Unknown';
                console.error('Upload response error:', status, errorText);
                throw new Error(`Upload failed: ${status} - ${errorText}`);
            }

            const uploadResult = await response.json();
            console.log('📤 Upload result:', uploadResult);

            // Update UI with uploaded file info
            setUploadedFiles(prev => ({
                ...prev,
                [questionId]: {
                    id: uploadResult.document_id,
                    name: file.name,
                    size: file.size,
                    type: file.mimeType,
                    uri: file.uri,
                },
            }));

            // Store file answer in answers state
            setAnswers(prev => ({
                ...prev,
                [questionId]: {
                    fileId: uploadResult.document_id,
                    filename: file.name,
                    fileSize: file.size,
                    fileType: file.mimeType,
                },
            }));

            setUploadStatus(prev => ({ ...prev, [questionId]: 'completed' }));
            setUploadProgress(prev => ({ ...prev, [questionId]: 100 }));

            // Clean up abort controller
            setUploadAbortController(prev => {
                const newControllers = { ...prev };
                delete newControllers[questionId];
                return newControllers;
            });

            console.log('🎉 File upload completed successfully!');

        } catch (error) {
            console.error('❌ File upload error:', error);
            const errorObj = error as Error;
            console.error('❌ Error details:', {
                name: errorObj.name,
                message: errorObj.message,
                stack: errorObj.stack,
                cause: errorObj.cause
            });

            setUploadStatus(prev => ({ ...prev, [questionId]: 'error' }));
            setUploadProgress(prev => ({ ...prev, [questionId]: 0 }));

            let errorMessage = 'Failed to upload file. Please try again.';
            let errorTitle = 'Upload Error';

            // Enhanced error handling for different scenarios
            if (errorObj.message.includes('cancelled') || errorObj.message.includes('aborted')) {
                errorTitle = 'Upload Cancelled';
                errorMessage = 'File upload was cancelled.';
                setUploadStatus(prev => ({ ...prev, [questionId]: 'idle' }));
                return;
            } else if (errorObj.message.includes('401') || errorObj.message.includes('Unauthorized')) {
                errorTitle = 'Authentication Error';
                errorMessage = 'Please log in again to continue.';
            } else if (errorObj.message.includes('403') || errorObj.message.includes('Forbidden')) {
                errorTitle = 'Access Denied';
                errorMessage = 'You do not have permission to upload files.';
            } else if (errorObj.message.includes('413') || errorObj.message.includes('Payload Too Large')) {
                errorTitle = 'File Too Large';
                errorMessage = 'Please select a file smaller than 10MB.';
            } else if (errorObj.message.includes('415') || errorObj.message.includes('Unsupported Media Type')) {
                errorTitle = 'Unsupported File Type';
                errorMessage = 'Please select a supported file type (PDF, DOC, DOCX, JPG, PNG, TXT).';
            } else if (errorObj.message.includes('422') || errorObj.message.includes('Unprocessable Entity')) {
                errorTitle = 'Invalid File';
                errorMessage = 'The file format is invalid. Please try a different file.';
            } else if (errorObj.message.includes('500') || errorObj.message.includes('Internal Server Error')) {
                errorTitle = 'Server Error';
                errorMessage = 'Server is experiencing issues. Please try again later.';
            } else if (errorObj.message.includes('Network') || errorObj.message.includes('fetch')) {
                errorTitle = 'Network Error';
                errorMessage = 'Please check your internet connection and try again.';
            }

            console.log('🚨 Displaying error alert:', { errorTitle, errorMessage });
            Alert.alert(errorTitle, errorMessage);

            // Clean up abort controller on error
            setUploadAbortController(prev => {
                const newControllers = { ...prev };
                delete newControllers[questionId];
                return newControllers;
            });
        }
    };

    // Cancel upload function
    const cancelUpload = (questionId: string) => {
        const controller = uploadAbortController[questionId];
        if (controller) {
            controller.abort();
            setUploadStatus(prev => ({ ...prev, [questionId]: 'idle' }));
            setUploadProgress(prev => ({ ...prev, [questionId]: 0 }));
            console.log('🛑 Upload cancelled for question:', questionId);
        }
    };

    // Test upload function for debugging
    const testUpload = async () => {
        try {
            // Create a simple test file
            const testFile = {
                name: 'test.txt',
                size: 12,
                mimeType: 'text/plain',
                uri: 'data:text/plain;base64,dGVzdCBmaWxlIGNvbnRlbnQ=',
            };

            console.log('🧪 Testing upload with file:', testFile);

            // Get dynamic backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();

            // Test the endpoint without authentication first
            const testResponse = await fetch(`${baseUrl}/health/`);
            console.log('🏥 Health check response:', testResponse.status, testResponse.ok);

            if (!testResponse.ok) {
                throw new Error(`Health check failed: ${testResponse.status}`);
            }

            Alert.alert('Test Results', `✅ Backend is accessible at ${baseUrl}\n\nHealth check: ${testResponse.status}\n\nNote: Full upload test requires authentication.`);
        } catch (error) {
            console.error('Test upload failed:', error);
            const errorObj = error as Error;
            Alert.alert('Test Failed', `❌ ${errorObj.message}`);
        }
    };

    // Test actual file upload with authentication
    const testRealUpload = async () => {
        try {
            console.log('🧪 Testing real file upload...');

            // Check if user is authenticated
            const token = await apiService.getAccessTokenAsync();
            console.log('🔑 Token check:', token ? 'Token found' : 'No token');

            if (!token) {
                Alert.alert('Authentication Required', 'Please log in first to test file uploads.');
                return;
            }

            // Get dynamic backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();
            console.log('🌐 Backend URL:', baseUrl);

            // Create a test file
            const testContent = 'This is a test file for upload testing. Created at: ' + new Date().toISOString();
            const testFile = new Blob([testContent], { type: 'text/plain' });

            // Create FormData
            const formData = new FormData();
            formData.append('file', testFile, 'test_upload.txt');

            console.log('📤 Starting real upload test to:', baseUrl);

            const response = await fetch(`${baseUrl}/documents/onboarding-upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Test-Upload': 'true',
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Real upload test successful:', result);
                Alert.alert('Upload Test Success', `File uploaded successfully!\n\nDocument ID: ${result.document_id}\nFilename: ${result.filename}\nSize: ${result.file_size} bytes`);
            } else {
                const errorText = await response.text();
                console.error('❌ Real upload test failed:', response.status, errorText);
                Alert.alert('Upload Test Failed', `Status: ${response.status}\nError: ${errorText}`);
            }
        } catch (error) {
            console.error('Real upload test failed:', error);
            const errorObj = error as Error;
            Alert.alert('Upload Test Failed', errorObj.message);
        }
    };

    // Test authentication state
    const testAuthState = async () => {
        try {
            console.log('🔐 Testing authentication state...');

            // Check user context
            console.log('👤 User context:', {
                user: user,
                isOnboardingComplete: user?.isOnboardingComplete,
                userId: user?.id
            });

            // Check API service state
            const token = await apiService.getAccessTokenAsync();
            console.log('🔑 API service token:', token ? 'Available' : 'Not available');

            // Check stored tokens
            const storedTokens = await apiService.getStoredTokens();
            console.log('💾 Stored tokens:', {
                accessToken: storedTokens.accessToken ? 'Available' : 'Not available',
                refreshToken: storedTokens.refreshToken ? 'Available' : 'Not available'
            });

            Alert.alert('Auth State Test',
                `User: ${user ? 'Logged in' : 'Not logged in'}\n` +
                `Token: ${token ? 'Available' : 'Not available'}\n` +
                `Stored: ${storedTokens.accessToken ? 'Yes' : 'No'}`
            );
        } catch (error) {
            console.error('Auth state test failed:', error);
            const errorObj = error as Error;
            Alert.alert('Auth Test Failed', errorObj.message);
        }
    };

    // Test DocumentPicker functionality
    const testDocumentPicker = async () => {
        try {
            console.log('📁 Testing DocumentPicker...');

            const result = await safeDocumentPicker.getDocumentAsync({
                type: ['*/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                console.log('❌ DocumentPicker was canceled');
                Alert.alert('DocumentPicker Test', 'File picker was canceled');
                return;
            }

            const file = result.assets[0];
            console.log('✅ DocumentPicker result:', {
                name: file.name,
                size: file.size,
                type: file.mimeType,
                uri: file.uri
            });

            Alert.alert('DocumentPicker Test',
                `File selected successfully!\n\nName: ${file.name}\nSize: ${file.size} bytes\nType: ${file.mimeType}`
            );
        } catch (error) {
            console.error('DocumentPicker test failed:', error);
            const errorObj = error as Error;
            Alert.alert('DocumentPicker Test Failed', errorObj.message);
        }
    };

    // Test basic fetch functionality
    const testBasicFetch = async () => {
        try {
            console.log('🌐 Testing basic fetch functionality...');

            // Get dynamic backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();

            console.log('🌐 Testing fetch to:', baseUrl);

            // Test a simple GET request
            const response = await fetch(`${baseUrl}/health/`);
            console.log('✅ Basic fetch test result:', response.status, response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Health check data:', data);
                Alert.alert('Basic Fetch Test', `✅ Success!\n\nStatus: ${response.status}\nMessage: ${data.message}`);
            } else {
                Alert.alert('Basic Fetch Test', `❌ Failed!\n\nStatus: ${response.status}`);
            }
        } catch (error) {
            console.error('Basic fetch test failed:', error);
            const errorObj = error as Error;
            Alert.alert('Basic Fetch Test Failed', errorObj.message);
        }
    };

    // Test file upload without DocumentPicker (direct file creation)
    const testDirectUpload = async () => {
        try {
            console.log('📁 Testing direct file upload...');

            // Check if user is authenticated
            const token = await apiService.getAccessTokenAsync();
            if (!token) {
                Alert.alert('Authentication Required', 'Please log in first to test file uploads.');
                return;
            }

            // Get dynamic backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();

            // Create a test file directly
            let testFile: Blob | { uri: string; name: string; size: number; mimeType: string; };
            if (Platform.OS === 'web') {
                // Web: Create Blob
                const testContent = 'This is a test file created directly. Time: ' + new Date().toISOString();
                testFile = new Blob([testContent], { type: 'text/plain' });
            } else {
                // Mobile: Create a mock file object
                testFile = {
                    uri: 'data:text/plain;base64,VGhpcyBpcyBhIHRlc3QgZmlsZQ==',
                    name: 'direct_test.txt',
                    size: 25,
                    mimeType: 'text/plain',
                };
            }

            console.log('📁 Test file created:', testFile);

            // Create FormData
            const formData = new FormData();
            if (Platform.OS === 'web') {
                formData.append('file', testFile as Blob, 'direct_test.txt');
            } else {
                formData.append('file', testFile as any);
            }

            console.log('📦 FormData created:', 'FormData created with test file');

            // Upload
            const response = await fetch(`${baseUrl}/documents/onboarding-upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Direct-Test': 'true',
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Direct upload test successful:', result);
                Alert.alert('Direct Upload Success',
                    `File uploaded successfully!\n\nDocument ID: ${result.document_id}\nFilename: ${result.filename}`
                );
            } else {
                const errorText = await response.text();
                console.error('❌ Direct upload test failed:', response.status, errorText);
                Alert.alert('Direct Upload Failed', `Status: ${response.status}\nError: ${errorText}`);
            }
        } catch (error) {
            console.error('Direct upload test failed:', error);
            const errorObj = error as Error;
            Alert.alert('Direct Upload Test Failed', errorObj.message);
        }
    };

    // Network monitoring function for debugging
    const monitorNetworkRequests = () => {
        if (__DEV__) {
            console.log('📡 Network Request Monitor Active');
            console.log('🔍 To see upload requests in network tab:');
            console.log('   1. Open browser DevTools (F12)');
            console.log('   2. Go to Network tab');
            console.log('   3. Filter by "Fetch/XHR"');
            console.log('   4. Try uploading a file');
            console.log('   5. Look for POST requests to /documents/onboarding-upload');

            // Monitor fetch globally in development
            if (typeof window !== 'undefined') {
                const originalFetch = window.fetch;
                window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
                    console.log('🌐 Fetch request:', {
                        url: input,
                        method: init?.method || 'GET',
                        headers: init?.headers,
                        body: init?.body ? 'FormData/File' : 'No body',
                        timestamp: new Date().toISOString()
                    });
                    return originalFetch(input, init);
                };
                console.log('✅ Global fetch monitoring enabled');
            }
        }
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

    const scrollToActiveTab = (index: number) => {
        const tabWidth = 90; // Tab width including margin
        const containerPadding = 32; // Horizontal padding of container
        const screenWidth = 400; // Approximate screen width
        const visibleWidth = screenWidth - containerPadding * 2;
        const centerOffset = visibleWidth / 2;
        const scrollOffset = Math.max(0, index * tabWidth - centerOffset + tabWidth / 2);

        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                x: scrollOffset,
                animated: true,
            });
        }, 100);
    };

    const handleNext = () => {
        if (currentQuestion.type === 'text' && !textInputs[currentQuestion.id]?.trim()) {
            Alert.alert(
                'Please provide an answer',
                'This question requires a response before continuing.'
            );
            return;
        }

        if (isLastQuestion) {
            // Save answers and navigate back
            handleComplete();
        } else {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            scrollToActiveTab(nextIndex);
        }
    };

    const handlePrevious = () => {
        if (!isFirstQuestion) {
            const prevIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(prevIndex);
            scrollToActiveTab(prevIndex);
        }
    };

    const handleComplete = async () => {
        // Check if all questions are answered
        if (!areAllQuestionsAnswered()) {
            const completedCount = getCompletedQuestionsCount();
            const totalCount = QUESTIONS.length;
            Alert.alert(
                'Incomplete Questionnaire',
                `Please answer all ${totalCount} questions before completing. You have completed ${completedCount} of ${totalCount} questions.`,
                [{ text: 'OK' }]
            );
            return;
        }

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

        try {
            // Save all answers to user context
            const allAnswers = {
                ...answers,
                ...textInputs,
                // Include file information properly
                ...Object.keys(uploadedFiles).reduce((acc: Record<string, any>, questionId) => {
                    acc[questionId] = {
                        fileId: uploadedFiles[questionId].id,
                        filename: uploadedFiles[questionId].name,
                        fileSize: uploadedFiles[questionId].size,
                        fileType: uploadedFiles[questionId].type,
                    };
                    return acc;
                }, {}),
                // Also include the uploaded_files for backend reference
                uploaded_files: uploadedFiles,
            };

            // Send onboarding data to backend
            const response = (await apiService.request('/auth/complete-onboarding', {
                method: 'POST',
                body: JSON.stringify(allAnswers),
            })) as { success: boolean };

            if (response.success) {
                completeOnboarding(allAnswers);

                Alert.alert(
                    'Welcome to Safe Wave!',
                    'Your onboarding is complete! Your emergency contact information has been saved for your safety.',
                    [
                        {
                            text: 'Get Started',
                            onPress: () => router.replace('/(tabs)'),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
            }
        } catch (error) {
            console.error('Onboarding completion error:', error);
            Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
        }
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
                                    answers[currentQuestion.id] === option && styles.selectedOption,
                                ]}
                                onPress={() => handleAnswer(option)}
                            >
                                <View style={styles.radioContainer}>
                                    <View
                                        style={[
                                            styles.radioButton,
                                            answers[currentQuestion.id] === option && styles.radioButtonSelected,
                                        ]}
                                    >
                                        {answers[currentQuestion.id] === option && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                    <ThemedText
                                        style={[
                                            styles.optionText,
                                            answers[currentQuestion.id] === option && styles.selectedOptionText,
                                        ]}
                                    >
                                        {option}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                );

            case 'scale':
                const { min, max, labels } = currentQuestion.scaleRange!;
                const getScaleColor = (value: number) => {
                    const range = max - min + 1;
                    const position = (value - min) / (range - 1);

                    if (position <= 0.2) return Colors.dark.danger; // Very low - Red
                    if (position <= 0.4) return Colors.dark.warning; // Low - Orange
                    if (position <= 0.6) return Colors.dark.secondary; // Medium - Yellow
                    if (position <= 0.8) return Colors.dark.success; // High - Green
                    return Colors.dark.primary; // Very high - Blue
                };

                const getScaleLabel = (value: number) => {
                    const range = max - min + 1;
                    const position = (value - min) / (range - 1);

                    if (position <= 0.2) return 'Very Low';
                    if (position <= 0.4) return 'Low';
                    if (position <= 0.6) return 'Medium';
                    if (position <= 0.8) return 'High';
                    return 'Very High';
                };

                return (
                    <View style={styles.scaleContainer}>
                        <View style={styles.scaleButtons}>
                            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(value => {
                                const scaleColor = getScaleColor(value);
                                const scaleLabel = getScaleLabel(value);
                                const isSelected = answers[currentQuestion.id] === value;

                                return (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.scaleButton,
                                            { borderColor: scaleColor },
                                            isSelected && { backgroundColor: scaleColor },
                                        ]}
                                        onPress={() => handleAnswer(value)}
                                    >
                                        <ThemedText
                                            style={[styles.scaleButtonText, { color: isSelected ? 'white' : scaleColor }]}
                                        >
                                            {value}
                                        </ThemedText>
                                        {isSelected && (
                                            <ThemedText style={styles.scaleButtonLabel}>{scaleLabel}</ThemedText>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={styles.scaleLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.dark.danger }]} />
                                <ThemedText style={styles.legendText}>Very Low</ThemedText>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.dark.warning }]} />
                                <ThemedText style={styles.legendText}>Low</ThemedText>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.dark.secondary }]} />
                                <ThemedText style={styles.legendText}>Medium</ThemedText>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.dark.success }]} />
                                <ThemedText style={styles.legendText}>High</ThemedText>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.dark.primary }]} />
                                <ThemedText style={styles.legendText}>Very High</ThemedText>
                            </View>
                        </View>
                    </View>
                );

            case 'text':
                return (
                    <ThemedView style={styles.textInputContainer}>
                        <ThemedText style={styles.textInputLabel}>Please share your thoughts:</ThemedText>
                        <TextInput
                            style={[
                                styles.textInputField,
                                textInputs[currentQuestion.id] && styles.textInputFieldFocused,
                            ]}
                            value={textInputs[currentQuestion.id] || ''}
                            onChangeText={text => handleTextInputChange(currentQuestion.id, text)}
                            placeholder='Share your thoughts, experiences, or concerns...'
                            placeholderTextColor='#8E8E93'
                            multiline={true}
                            textAlignVertical='top'
                            autoFocus={false}
                            selectionColor='#007AFF'
                            cursorColor='#007AFF'
                        />
                    </ThemedView>
                );

            case 'file':
                const fileStatus = uploadStatus[currentQuestion.id];
                const uploadedFile = uploadedFiles[currentQuestion.id];

                return (
                    <View style={styles.fileUploadContainer}>
                        <ThemedText style={styles.fileUploadLabel}>{currentQuestion.text}</ThemedText>

                        {!uploadedFile ? (
                            <View style={styles.fileUploadOptions}>
                                {fileStatus === 'uploading' ? (
                                    // Upload in progress view
                                    <View style={styles.uploadProgressContainer}>
                                        <View style={styles.uploadProgressHeader}>
                                            <IconSymbol size={24} name='arrow.clockwise' color={Colors.dark.primary} />
                                            <ThemedText style={styles.fileUploadText}>Uploading...</ThemedText>
                                        </View>

                                        {/* Progress bar */}
                                        <View style={styles.progressBarContainer}>
                                            <View style={styles.uploadProgressBar}>
                                                <View
                                                    style={[
                                                        styles.uploadProgressBarFill,
                                                        { width: `${uploadProgress[currentQuestion.id] || 0}%` }
                                                    ]}
                                                />
                                            </View>
                                            <ThemedText style={styles.uploadProgressText}>
                                                {Math.round(uploadProgress[currentQuestion.id] || 0)}%
                                            </ThemedText>
                                        </View>

                                        {/* Cancel button */}
                                        <TouchableOpacity
                                            style={styles.cancelUploadButton}
                                            onPress={() => cancelUpload(currentQuestion.id)}
                                        >
                                            <IconSymbol size={20} name='xmark.circle.fill' color={Colors.dark.danger} />
                                            <ThemedText style={styles.cancelUploadText}>Cancel</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                ) : fileStatus === 'error' ? (
                                    // Error state view
                                    <View style={styles.uploadErrorContainer}>
                                        <IconSymbol size={24} name='exclamationmark.triangle.fill' color={Colors.dark.danger} />
                                        <ThemedText style={styles.uploadErrorText}>Upload failed</ThemedText>
                                        <ThemedText style={styles.uploadErrorSubtext}>
                                            Please try again or contact support
                                        </ThemedText>
                                        <TouchableOpacity
                                            style={styles.retryUploadButton}
                                            onPress={() => handleFileUpload(currentQuestion.id)}
                                        >
                                            <IconSymbol size={20} name='arrow.clockwise' color={Colors.dark.primary} />
                                            <ThemedText style={styles.retryUploadText}>Retry Upload</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    // Upload button
                                    <TouchableOpacity
                                        style={[
                                            styles.fileUploadButton,
                                            !isOnline && styles.fileUploadButtonOffline
                                        ]}
                                        onPress={() => handleFileUpload(currentQuestion.id)}
                                        disabled={!isOnline}
                                    >
                                        <IconSymbol
                                            size={24}
                                            name={isOnline ? 'doc.badge.plus' : 'wifi.slash'}
                                            color={isOnline ? Colors.dark.primary : Colors.dark.muted}
                                        />
                                        <ThemedText style={[
                                            styles.fileUploadText,
                                            !isOnline && styles.fileUploadTextOffline
                                        ]}>
                                            {isOnline ? 'Tap to upload documents' : 'No internet connection'}
                                        </ThemedText>
                                        <ThemedText style={[
                                            styles.fileUploadSubtext,
                                            !isOnline && styles.fileUploadSubtextOffline
                                        ]}>
                                            {isOnline ? 'PDF, DOC, or image files' : 'Please check your connection'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* Debug connection button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.muted }]}
                                        onPress={async () => {
                                            try {
                                                const { testBackendConnection, getBackendUrl } = await import('@/services/config');
                                                const baseUrl = await getBackendUrl();
                                                const isConnected = await testBackendConnection();

                                                Alert.alert(
                                                    'Connection Test',
                                                    `Backend URL: ${baseUrl}\nConnection: ${isConnected ? '✅ Success' : '❌ Failed'}`,
                                                    [{ text: 'OK' }]
                                                );
                                            } catch (error) {
                                                const errorObj = error as Error;
                                                Alert.alert('Connection Test Failed', errorObj.message);
                                            }
                                        }}
                                    >
                                        <IconSymbol size={20} name='network' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test Connection</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* Test upload button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.warning }]}
                                        onPress={testUpload}
                                    >
                                        <IconSymbol size={20} name='play.circle' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test Upload</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* Real upload test button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.success }]}
                                        onPress={testRealUpload}
                                    >
                                        <IconSymbol size={20} name='doc.badge.plus' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test Real Upload</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* Auth state test button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.muted }]}
                                        onPress={testAuthState}
                                    >
                                        <IconSymbol size={20} name='person.circle' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test Auth State</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* DocumentPicker test button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.accent }]}
                                        onPress={testDocumentPicker}
                                    >
                                        <IconSymbol size={20} name='folder' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test File Picker</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* Direct upload test button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.primary }]}
                                        onPress={testDirectUpload}
                                    >
                                        <IconSymbol size={20} name='arrow.up.circle' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test Direct Upload</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {/* Basic fetch test button for development */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.fileUploadButton, { backgroundColor: Colors.dark.secondary }]}
                                        onPress={testBasicFetch}
                                    >
                                        <IconSymbol size={20} name='network' color={Colors.dark.text} />
                                        <ThemedText style={styles.fileUploadText}>Test Basic Fetch</ThemedText>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.skipButton}
                                    onPress={() => {
                                        // Mark as skipped by setting a special value
                                        setAnswers(prev => ({
                                            ...prev,
                                            [currentQuestion.id]: 'skipped',
                                        }));
                                    }}
                                >
                                    <IconSymbol size={20} name='arrow.right' color={Colors.dark.muted} />
                                    <ThemedText style={styles.skipButtonText}>Skip this step</ThemedText>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadedFileContainer}>
                                <IconSymbol size={24} name='checkmark.circle.fill' color={Colors.dark.success} />
                                <ThemedText style={styles.uploadedFileName}>{uploadedFile.name}</ThemedText>
                                <TouchableOpacity
                                    style={styles.removeFileButton}
                                    onPress={() => {
                                        setUploadedFiles(prev => {
                                            const newFiles = { ...prev };
                                            delete newFiles[currentQuestion.id];
                                            return newFiles;
                                        });
                                        setUploadStatus(prev => {
                                            const newStatus = { ...prev };
                                            delete newStatus[currentQuestion.id];
                                            return newStatus;
                                        });
                                        setAnswers(prev => {
                                            const newAnswers = { ...prev };
                                            delete newAnswers[currentQuestion.id];
                                            return newAnswers;
                                        });
                                    }}
                                >
                                    <IconSymbol size={16} name='xmark.circle.fill' color={Colors.dark.danger} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
                        <IconSymbol size={24} name='chevron.left' color={theme.primary} />
                        <ThemedText style={styles.backButtonText}>Back</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeButton} onPress={handleCloseQuestionnaire}>
                        <IconSymbol size={24} name='xmark' color={theme.primary} />
                    </TouchableOpacity>
                </ThemedView>

                {/* Network Status Indicator */}
                {!isOnline && (
                    <ThemedView style={styles.networkStatusContainer}>
                        <IconSymbol size={16} name='wifi.slash' color={Colors.dark.danger} />
                        <ThemedText style={styles.networkStatusText}>
                            No internet connection - Uploads will not work
                        </ThemedText>
                    </ThemedView>
                )}

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <ThemedText style={styles.progressText}>
                        {getCompletedQuestionsCount()} of {QUESTIONS.length} questions completed
                    </ThemedText>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${getCompletionPercentage()}%`,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Question Progress Tabs */}
                <View style={styles.questionTabsContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.questionTabsContent}
                        style={styles.tabsScrollView}
                    >
                        {QUESTIONS.map((question, index) => {
                            const isAnswered = (() => {
                                if (question.type === 'text') {
                                    return textInputs[question.id] && textInputs[question.id].trim().length > 0;
                                } else if (question.type === 'multiple-choice' || question.type === 'scale') {
                                    return answers[question.id] !== undefined;
                                } else if (question.type === 'file') {
                                    // File questions are optional - always show as answered
                                    return true;
                                }
                                return false;
                            })();
                            const isCurrent = index === currentQuestionIndex;

                            return (
                                <TouchableOpacity
                                    key={question.id}
                                    style={[
                                        styles.questionTab,
                                        isCurrent && styles.activeQuestionTab,
                                        isAnswered && !isCurrent && styles.answeredQuestionTab,
                                        !isAnswered && !isCurrent && styles.unansweredQuestionTab,
                                    ]}
                                    onPress={() => {
                                        setCurrentQuestionIndex(index);
                                        scrollToActiveTab(index);
                                    }}
                                >
                                    <View style={styles.questionTabContent}>
                                        <ThemedText
                                            style={[
                                                styles.questionTabNumber,
                                                isCurrent && styles.activeQuestionTabNumber,
                                                !isAnswered && !isCurrent && styles.unansweredQuestionTabNumber,
                                            ]}
                                        >
                                            {index + 1}
                                        </ThemedText>
                                        {isAnswered ? (
                                            <IconSymbol
                                                size={14}
                                                name='checkmark.circle.fill'
                                                color={isCurrent ? 'white' : Colors.dark.success}
                                            />
                                        ) : (
                                            <IconSymbol
                                                size={14}
                                                name='questionmark.circle'
                                                color={isCurrent ? 'white' : Colors.dark.primary}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Emergency Contact Notice */}
                    {(currentQuestion.id === 'emergency_contact_name' ||
                        currentQuestion.id === 'emergency_contact_email' ||
                        currentQuestion.id === 'emergency_contact_relationship') && (
                            <ModernCard variant='outlined' style={styles.emergencyNotice}>
                                <ThemedText style={styles.emergencyNoticeText}>
                                    ⚠️ Emergency contact information is required for your safety
                                </ThemedText>
                            </ModernCard>
                        )}

                    {/* Question */}
                    <ThemedView style={styles.questionContainer}>
                        <ThemedText type='title' style={styles.questionText}>
                            {currentQuestion.text}
                        </ThemedText>

                        {/* Show warning if on last question but not all questions are answered */}
                        {isLastQuestion && !areAllQuestionsAnswered() && (
                            <ModernCard variant='outlined' style={styles.incompleteWarning}>
                                <ThemedText style={styles.incompleteWarningText}>
                                    ⚠️ You must answer all {QUESTIONS.length} questions before completing the
                                    questionnaire. You have completed {getCompletedQuestionsCount()} of{' '}
                                    {QUESTIONS.length} questions.
                                </ThemedText>
                            </ModernCard>
                        )}
                    </ThemedView>

                    {/* Answer Options */}
                    {renderQuestion()}

                    {/* Add extra padding at bottom for keyboard */}
                    <View style={styles.keyboardSpacer} />
                </ScrollView>

                {/* Navigation Buttons */}
                <ModernCard variant='elevated' style={styles.navigationContainer}>
                    {!isFirstQuestion && (
                        <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                            <IconSymbol size={20} name='chevron.left' color={theme.primary} />
                            <ThemedText style={styles.previousButtonText}>Previous</ThemedText>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            (isLastQuestion ? !areAllQuestionsAnswered() : !isAnswerValid()) &&
                            styles.disabledButton,
                        ]}
                        onPress={handleNext}
                        disabled={isLastQuestion ? !areAllQuestionsAnswered() : !isAnswerValid()}
                    >
                        <ThemedText style={styles.nextButtonText}>
                            {isLastQuestion ? 'Complete' : 'Next'}
                        </ThemedText>
                        {!isLastQuestion && <IconSymbol size={20} name='chevron.right' color='white' />}
                    </TouchableOpacity>
                </ModernCard>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.primary,
        minHeight: 2,
        ...Shadows.small,
    },
    questionTabsContainer: {
        backgroundColor: Colors.dark.surface,
        paddingVertical: 8,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        ...Shadows.small,
    },
    tabsScrollView: {
        flexGrow: 0,
    },
    questionTabsContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    questionTab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.dark.card,
        borderWidth: 2,
        borderColor: Colors.dark.border,
        minWidth: 90,
        minHeight: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
    activeQuestionTab: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
        ...Shadows.large,
    },
    answeredQuestionTab: {
        backgroundColor: Colors.dark.card,
        borderColor: Colors.dark.success,
        ...Shadows.small,
    },
    unansweredQuestionTab: {
        backgroundColor: Colors.dark.card,
        borderColor: Colors.dark.primary,
        opacity: 0.8,
    },
    questionTabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    questionTabNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activeQuestionTabNumber: {
        color: 'white',
    },
    unansweredQuestionTabNumber: {
        color: Colors.dark.primary,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.surface,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: Spacing.xs,
        color: Colors.dark.text,
        opacity: 0.8,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: Spacing.sm,
        textAlign: 'center',
        color: Colors.dark.text,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        textAlign: 'center',
        opacity: 0.7,
        color: Colors.dark.text,
    },
    progressContainer: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        margin: Spacing.xl,
        marginTop: Spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.dark.border,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.dark.primary,
        borderRadius: BorderRadius.sm,
    },
    progressText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
        opacity: 0.7,
        color: Colors.dark.text,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
        paddingTop: Spacing.lg,
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
        color: Colors.dark.text,
        letterSpacing: -0.3,
    },
    optionsContainer: {
        gap: Spacing.md,
    },
    optionButton: {
        padding: Spacing.lg,
        backgroundColor: Colors.dark.card,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        minHeight: 56,
        ...Shadows.small,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.dark.border,
        marginRight: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: Colors.dark.primary,
    },
    radioButtonInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.primary,
    },
    selectedOption: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.surface,
    },
    optionText: {
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    selectedOptionText: {
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    scaleContainer: {
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        ...Shadows.small,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.sm,
    },
    scaleLabel: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
        opacity: 0.7,
        color: Colors.dark.text,
    },
    scaleButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    scaleButton: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.card,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.small,
    },
    selectedScaleButton: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.primary,
    },
    scaleButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    selectedScaleButtonText: {
        color: 'white',
    },
    scaleButtonLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: 'white',
        marginTop: 2,
    },
    scaleLegend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.sm,
    },
    legendItem: {
        alignItems: 'center',
        flex: 1,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.dark.muted,
        textAlign: 'center',
    },
    fileUploadContainer: {
        marginBottom: Spacing.lg,
    },
    fileUploadLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: Spacing.md,
    },
    fileUploadOptions: {
        gap: Spacing.md,
    },
    fileUploadButton: {
        backgroundColor: Colors.dark.card,
        borderWidth: 2,
        borderColor: Colors.dark.border,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    fileUploadButtonUploading: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.surface,
    },
    fileUploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.primary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    fileUploadSubtext: {
        fontSize: 14,
        color: Colors.dark.muted,
        textAlign: 'center',
    },
    fileUploadButtonOffline: {
        borderColor: Colors.dark.muted,
        backgroundColor: Colors.dark.surface,
        opacity: 0.6,
    },
    fileUploadTextOffline: {
        color: Colors.dark.muted,
    },
    fileUploadSubtextOffline: {
        color: Colors.dark.muted,
    },
    uploadedFileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.dark.success,
    },
    uploadedFileName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.text,
        marginLeft: Spacing.sm,
        flex: 1,
    },
    removeFileButton: {
        padding: Spacing.xs,
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: Spacing.sm,
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.muted,
    },
    // Upload progress styles
    uploadProgressContainer: {
        backgroundColor: Colors.dark.card,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        borderStyle: 'solid',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    uploadProgressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    uploadProgressBar: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.dark.border,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    uploadProgressBarFill: {
        height: '100%',
        backgroundColor: Colors.dark.primary,
        borderRadius: BorderRadius.full,
    },
    uploadProgressText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.primary,
        textAlign: 'center',
    },
    cancelUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.danger,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
    },
    cancelUploadText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'white',
    },
    // Error state styles
    uploadErrorContainer: {
        backgroundColor: Colors.dark.card,
        borderWidth: 2,
        borderColor: Colors.dark.danger,
        borderStyle: 'solid',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    uploadErrorText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.danger,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    uploadErrorSubtext: {
        fontSize: 14,
        color: Colors.dark.muted,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    retryUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
    },
    retryUploadText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'white',
    },
    // Network status styles
    networkStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.danger,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    networkStatusText: {
        fontSize: 14,
        fontWeight: '500',
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
        marginBottom: Spacing.xl,
    },
    textInputLabel: {
        fontSize: 16,
        marginBottom: Spacing.lg,
        fontWeight: '600',
        textAlign: 'left',
        opacity: 0.9,
        color: Colors.dark.text,
        letterSpacing: -0.2,
    },

    textInputField: {
        width: '100%',
        minHeight: 120,
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        borderWidth: 1.5,
        borderColor: Colors.dark.border,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'left',
        color: Colors.dark.text,
        textAlignVertical: 'top',
        fontWeight: '400',
        ...Shadows.small,
    },
    textInputFieldFocused: {
        borderColor: Colors.dark.primary,
        borderWidth: 2,
        ...Shadows.glow,
    },
    incompleteWarning: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.dark.warning + '20',
        borderColor: Colors.dark.warning,
    },
    incompleteWarningText: {
        fontSize: 14,
        color: Colors.dark.warning,
        textAlign: 'center',
        fontWeight: '500',
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        margin: Spacing.xl,
        marginTop: Spacing.sm,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: Colors.dark.background,
    },
    previousButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.dark.surface,
    },
    previousButtonText: {
        fontSize: 16,
        marginLeft: Spacing.sm,
        fontWeight: '500',
        opacity: 0.7,
        color: Colors.dark.text,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        minWidth: 100,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: Colors.dark.disabled,
    },

    emergencyNotice: {
        backgroundColor: Colors.dark.warning + '20', // 20% opacity
        borderWidth: 1,
        borderColor: Colors.dark.warning + '40', // 40% opacity
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    keyboardSpacer: {
        height: 100, // Space for keyboard
    },

    emergencyNoticeText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 20,
        color: Colors.dark.text,
    },
});
