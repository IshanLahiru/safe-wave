import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { ThemedText } from '@/components/ThemedText';

function AppContent() {
  const { user, isLoading, shouldRedirectToLogin, validateTokens } = useUser();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Validate tokens on every navigation/segment change
  useEffect(() => {
    if (user && !isLoading) {
      const validateOnNavigation = async () => {
        const isValid = await validateTokens();
        if (!isValid) {
          console.log('🚫 Navigation blocked - invalid tokens');
        }
      };

      validateOnNavigation();
    }
  }, [segments, user, isLoading, validateTokens]);

  // Handle redirection to login when needed
  useEffect(() => {
    if (shouldRedirectToLogin) {
      console.log('🔄 Redirecting to login screen...');
      router.replace('/auth/login');
    }
  }, [shouldRedirectToLogin, router]);

  // Force redirect to login if no user and not loading
  useEffect(() => {
    if (!isLoading && !user && !shouldRedirectToLogin) {
      console.log('🚫 No user found, forcing redirect to login');
      router.replace('/auth/login');
    }
  }, [isLoading, user, shouldRedirectToLogin, router]);

  // Handle navigation after successful authentication
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🚀 User authenticated, checking navigation path...');
      console.log('📊 User onboarding status:', user.isOnboardingComplete);

      if (user.isOnboardingComplete) {
        console.log('🏠 User onboarding complete, navigating to home');
        router.replace('/(tabs)');
      } else {
        console.log('📝 User onboarding incomplete, navigating to onboarding');
        router.replace('/onboarding-questionnaire');
      }
    }
  }, [user, isLoading, router]);

  // Validate tokens on app focus/navigation
  useEffect(() => {
    if (user && !isLoading) {
      const validateOnFocus = async () => {
        const isValid = await validateTokens();
        if (!isValid) {
          console.log('🚫 Token validation failed on navigation');
        }
      };

      validateOnFocus();
    }
  }, [user, isLoading, validateTokens]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  if (isLoading) {
    // Show loading screen while checking authentication
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ThemedText type="title" style={{ fontSize: 24, marginBottom: 20 }}>
          🌊 Safe Wave
        </ThemedText>
        <ThemedText style={{ fontSize: 16, opacity: 0.7 }}>
          Loading...
        </ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.5, marginTop: 20 }}>
          Checking authentication...
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Always include all screens to prevent navigation errors */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding-questionnaire" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
