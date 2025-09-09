import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ModernInput } from '@/components/ui/ModernInput';
import { useUser } from '@/contexts/UserContext';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { API_CONFIG } from '@/services/config';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, user } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health/`);
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        console.log('Backend status check failed:', error);
        setBackendStatus('offline');
      }
    };

    checkBackendStatus();
  }, []);

  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    console.log('🔐 Attempting login with:', { email, password });

    try {
      // First test backend connectivity
      console.log('🌐 Testing backend connectivity...');
      try {
        const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health/`);
        if (!healthResponse.ok) {
          throw new Error(`Backend health check failed: ${healthResponse.status}`);
        }
        console.log('✅ Backend is reachable');
      } catch (healthError) {
        console.error('❌ Backend connectivity test failed:', healthError);
        setErrorMessage(
          'Cannot connect to server. Please check if the backend is running and accessible.'
        );
        return;
      }

      console.log('🔐 Proceeding with login...');

      // Add detailed logging for debugging
      console.log('📱 Platform:', Platform.OS);
      console.log('🌐 Backend URL:', API_CONFIG.BASE_URL);

      const success = await login(email, password);
      console.log('🔐 Login result:', success);

      if (success) {
        console.log('✅ Login successful, navigation will be handled by root layout');
        // Navigation will be handled by the root layout based on user state
      } else {
        console.log('❌ Login failed, showing error message');
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('💥 Login error caught:', error);
      let errorMsg = 'An unexpected error occurred. Please try again.'; // Generic message

      if (error instanceof Error) {
        console.error('Login error details:', error.message); // Log full error for debugging
        if (error.message.includes('Network request failed')) {
          errorMsg =
            'Cannot connect to server. Please check your internet connection and if the backend is running.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Request timed out. The server might be slow or overloaded.';
        } else if (error.message.includes('401')) {
          errorMsg = 'Invalid credentials. Please check your email and password.';
        } else if (error.message.includes('500')) {
          errorMsg = 'Server error. Please try again later.';
        }
        // For any other specific errors, the generic message will be used.
      }

      setErrorMessage(errorMsg);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <IconSymbol size={60} name='waveform' color={Colors.dark.primary} />
          </ThemedView>
          <ThemedText type='title' style={styles.title}>
            Welcome Back
          </ThemedText>
          <ThemedText type='body' style={styles.subtitle}>
            Sign in to continue your safe journey
          </ThemedText>

          {/* Backend Status Indicator */}
          <View style={styles.backendStatusContainer}>
            <View
              style={[
                styles.backendStatusDot,
                {
                  backgroundColor:
                    backendStatus === 'online'
                      ? Colors.dark.success
                      : backendStatus === 'offline'
                        ? Colors.dark.danger
                        : Colors.dark.warning,
                },
              ]}
            />
            <ThemedText type='caption' style={styles.backendStatusText}>
              {backendStatus === 'online'
                ? 'Online'
                : backendStatus === 'offline'
                  ? 'Offline'
                  : 'Checking...'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Form */}
        <ThemedView style={styles.form}>
          <ModernInput
            label='Email Address'
            placeholder='Enter your email'
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          <View style={styles.passwordContainer}>
            <ModernInput
              label='Password'
              placeholder='Enter your password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <IconSymbol
                size={20}
                name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                color={Colors.dark.primary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <ThemedText style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>
          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <IconSymbol size={16} name='exclamationmark.triangle.fill' color='#FF3B30' />
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </View>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <ThemedText style={styles.signupButtonText}>Create New Account</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  backendStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  backendStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  backendStatusText: {
    fontSize: 12,
    opacity: 0.8,
  },
  form: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 350,
    marginBottom: Spacing.lg,
  },
  passwordContainer: {
    width: '100%',
    maxWidth: 350,
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 8,
    zIndex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    width: '100%',
    maxWidth: 350,
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    width: '100%',
    maxWidth: 350,
  },
  loginButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: Colors.dark.disabled,
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
    maxWidth: 350,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    fontSize: 14,
    opacity: 0.6,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
