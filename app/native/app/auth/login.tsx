import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, user } = useUser();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Note: Navigation is handled by the root layout based on user state
  // This prevents navigation conflicts

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
      const success = await login(email, password);
      if (success) {
        console.log('✅ Login successful, navigation will be handled by root layout');
        // Navigation will be handled by the root layout based on user state
      } else {
        console.log('❌ Login failed, showing error message');
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('💥 Login error caught:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      setErrorMessage(errorMsg);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 60),
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <IconSymbol size={60} name="waveform" color={theme.tint} />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            🌊 Welcome Back
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sign in to continue your safe journey
          </ThemedText>
        </ThemedView>

        {/* Form */}
        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputContainer}>
            <IconSymbol size={20} name="envelope.fill" color={theme.tint} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.icon}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <IconSymbol size={20} name="lock.fill" color={theme.tint} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.icon}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <IconSymbol
                size={20}
                name={showPassword ? "eye.slash.fill" : "eye.fill"}
                color={theme.tint}
              />
            </TouchableOpacity>
          </ThemedView>

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
              <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#FF3B30" />
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </View>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <ThemedText style={styles.signupButtonText}>
              Create New Account
            </ThemedText>
          </TouchableOpacity>

          {/* Debug Information */}
          <ThemedView style={styles.debugCard}>
            <ThemedText type="defaultSemiBold" style={styles.debugTitle}>
              🔍 Debug Info
            </ThemedText>
            <ThemedText style={styles.debugText}>
              User: {user ? 'Logged In' : 'Not Logged In'}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              Onboarding: {user?.isOnboardingComplete ? 'Complete' : 'Incomplete'}
            </ThemedText>
          </ThemedView>

          {/* Network Test Button */}
          <TouchableOpacity
            style={styles.networkTestButton}
            onPress={async () => {
              try {
                const response = await fetch('http://172.20.10.3:8000/health/');
                const data = await response.json();
                Alert.alert('Network Test', `Backend connected: ${data.message}`);
              } catch (error) {
                Alert.alert('Network Test', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
          >
            <ThemedText style={styles.networkTestButtonText}>
              🔧 Test Network Connection
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
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
  },
  form: {
    flex: 1,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 15,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxWidth: 350,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 350,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 350,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#687076',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 350,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  debugCard: {
    backgroundColor: 'rgba(108, 117, 125, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 117, 125, 0.2)',
    width: '100%',
    maxWidth: 350,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  networkTestButton: {
    backgroundColor: '#FF9500',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    maxWidth: 350,
  },
  networkTestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
