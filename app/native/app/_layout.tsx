import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { UserProvider, useUser } from '@/contexts/UserContext';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

function AppContent() {
  const { user, isLoading, shouldRedirectToLogin, validateTokens } = useUser();
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


  // Handle navigation based on authentication state
  useEffect(() => {
    if (!isLoading) {
      if (user && !shouldRedirectToLogin) {
        console.log('🚀 _layout.tsx: User authenticated, checking navigation path...');
        console.log('📊 _layout.tsx: User onboarding status:', user.isOnboardingComplete);

        if (user.isOnboardingComplete) {
          console.log('🏠 _layout.tsx: User onboarding complete, navigating to home');
          router.replace('/(tabs)');
        } else {
          console.log('📝 _layout.tsx: User onboarding incomplete, navigating to onboarding');
          router.replace('/onboarding-questionnaire');
        }
      } else if (!user || shouldRedirectToLogin) {
        console.log('🚫 _layout.tsx: User not authenticated or redirecting, navigating to login');
        router.replace('/auth/login');
      }
    }
  }, [user, isLoading, shouldRedirectToLogin, router]);

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
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colors.dark.background,
          }}
        >
          <ThemedText type='title' style={{ fontSize: 24, marginBottom: 20 }}>
            🌊 Safe Wave
          </ThemedText>
          <ThemedText style={{ fontSize: 16, opacity: 0.7 }}>Loading...</ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.5, marginTop: 20 }}>
            Checking authentication...
          </ThemedText>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {user && !shouldRedirectToLogin ? (
          // Authenticated routes
          <>
            <Stack.Screen name='(tabs)' />
            <Stack.Screen name='onboarding-questionnaire' />
            <Stack.Screen name='medical-documents' />
          </>
        ) : (
          // Authentication routes (show if no user or if redirection is explicitly requested)
          <>
            <Stack.Screen name='auth/login' />
            <Stack.Screen name='auth/signup' />
          </>
        )}
        <Stack.Screen name='+not-found' />
      </Stack>
      <StatusBar style='light' />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </SafeAreaProvider>
  );
}
