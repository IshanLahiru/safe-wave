import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import apiService, { OnboardingData, UserPreferences } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'healthcare_provider';
  isOnboardingComplete: boolean;
  emergencyContact?: {
    name: string;
    email: string;
    relationship: string;
  };
  carePersonEmail?: string;
  preferences?: {
    checkinFrequency: string;
    darkMode: boolean;
    language: string;
  };
  onboardingAnswers?: Record<string, any>;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  shouldRedirectToLogin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
  validateTokens: () => Promise<boolean>;
  completeOnboarding: (answers: Record<string, any>) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  // Function to validate tokens and redirect if needed
  const validateTokens = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken, refreshToken } = await apiService.getStoredTokens();

      if (!accessToken || !refreshToken) {
        console.log('❌ No tokens found, redirecting to login');
        setUser(null);
        setShouldRedirectToLogin(true);
        setIsLoading(false); // Ensure loading is false for redirection
        return false;
      }

      // Try to get current user to validate token
      try {
        await apiService.getCurrentUser();
        return true; // Token is valid
      } catch (error) {
        console.log('❌ Token validation failed, attempting refresh...');

        try {
          await apiService.refreshToken();
          await apiService.getCurrentUser(); // Verify refresh worked
          return true; // Token refreshed successfully
        } catch (refreshError) {
          console.log('❌ Token refresh failed, redirecting to login');
          await apiService.clearTokens();
          setUser(null);
          setShouldRedirectToLogin(true);
          setIsLoading(false); // Ensure loading is false for redirection
          return false;
        }
      }
    } catch (error) {
      console.log('❌ Token validation error:', error);
      await apiService.clearTokens();
      setUser(null);
      setShouldRedirectToLogin(true);
      setIsLoading(false); // Ensure loading is false for redirection
      return false;
    }
  }, []);

  // Listen to API service authentication state changes
  useEffect(() => {
    const authListener = (isAuthenticated: boolean) => {
      console.log('🔐 API Auth state changed:', isAuthenticated);
      if (!isAuthenticated && user) {
        console.log('🚫 User logged out via API service, clearing user state');
        setUser(null);
        setShouldRedirectToLogin(true);
        setIsLoading(false); // Ensure loading is false for redirection
      }
    };

    apiService.addAuthStateListener(authListener);

    return () => {
      apiService.removeAuthStateListener(authListener);
    };
  }, [user]);

  // Periodic token validation to catch expired tokens
  useEffect(() => {
    if (user && !isLoading) {
      const interval = setInterval(async () => {
        try {
          const isValid = await validateTokens();
          if (!isValid) {
            console.log('🕐 Periodic validation failed, redirecting to login');
            setUser(null);
            setShouldRedirectToLogin(true);
            setIsLoading(false); // Ensure loading is false for redirection
          }
        } catch (error) {
          console.log('🕐 Periodic validation error, redirecting to login:', error);
          setUser(null);
          setShouldRedirectToLogin(true);
          setIsLoading(false); // Ensure loading is false for redirection
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [user, isLoading, validateTokens]);

  // Check for existing authentication on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.log('Authentication check timeout, forcing login screen');
        setIsLoading(false);
        setUser(null);
      }, 5000); // 5 second timeout

      try {
        // Check if we have stored tokens first
        console.log('🔍 Checking for stored tokens...');
        const { accessToken, refreshToken } = await apiService.getStoredTokens();

        console.log('📱 Token status:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length || 0,
          refreshTokenLength: refreshToken?.length || 0,
        });

        if (accessToken && refreshToken) {
          try {
            // Try to get current user with stored token
            console.log('✅ Tokens found, attempting to fetch user profile...');
            const userProfile = await apiService.getCurrentUser();

            // Transform backend user data to frontend format
            const transformedUser: User = {
              id: userProfile.id.toString(),
              email: userProfile.email,
              name: userProfile.name,
              role: userProfile.role,
              isOnboardingComplete: userProfile.isOnboardingComplete,
              emergencyContact: userProfile.emergencyContact,
              carePersonEmail: userProfile.carePersonEmail,
              preferences: userProfile.preferences,
              onboardingAnswers: userProfile.onboardingAnswers,
            };

            setUser(transformedUser);
            console.log('✅ User authenticated successfully');
          } catch (userError) {
            console.log('❌ User profile fetch failed, attempting token refresh...');

            // Try to refresh the token before giving up
            try {
              await apiService.refreshToken();
              console.log('✅ Token refreshed, retrying user profile fetch...');

              const userProfile = await apiService.getCurrentUser();
              const transformedUser: User = {
                id: userProfile.id.toString(),
                email: userProfile.email,
                name: userProfile.name,
                role: userProfile.role,
                isOnboardingComplete: userProfile.isOnboardingComplete,
                emergencyContact: userProfile.emergencyContact,
                carePersonEmail: userProfile.carePersonEmail,
                preferences: userProfile.preferences,
                onboardingAnswers: userProfile.onboardingAnswers,
              };

              setUser(transformedUser);
              console.log('✅ User authenticated after token refresh');
            } catch (refreshError) {
              console.log('❌ Token refresh failed, clearing tokens:', refreshError);
              // Clear invalid tokens and redirect to login
              await apiService.clearTokens();
              setUser(null);
              setShouldRedirectToLogin(true);
              setIsLoading(false); // Ensure loading is false for redirection
            }
            console.log('🚪 Redirecting to login screen due to invalid tokens');
          }
        } else {
          console.log('❌ No tokens found, user needs to login');
          setUser(null);
          setShouldRedirectToLogin(true);
          setIsLoading(false); // Ensure loading is false for redirection
          console.log('🚪 Redirecting to login screen due to missing tokens');
        }
      } catch (error) {
        console.log('❌ Authentication check failed:', error);
        // Clear any invalid tokens and ensure user is null
        await apiService.clearTokens();
        setUser(null);
        setShouldRedirectToLogin(true); // Explicitly set for consistency
        setIsLoading(false); // Ensure loading is false for redirection
        console.log('🚪 Redirecting to login screen due to authentication error');
      } finally {
        clearTimeout(timeoutId);
        console.log('🏁 Authentication check complete');
        console.log('📱 Final user state:', user ? 'authenticated' : 'not authenticated');
        console.log('🔄 Setting loading to false');
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Ensure API service has tokens loaded when user context changes
  useEffect(() => {
    if (user && !isLoading) {
      // Double-check that API service has the tokens
      const ensureTokensLoaded = async () => {
        try {
          console.log('🔍 Ensuring API service has tokens loaded...');
          const { accessToken, refreshToken } = await apiService.getStoredTokens();

          if (accessToken && refreshToken) {
            console.log('✅ Tokens confirmed in API service');
          } else {
            console.log('⚠️ Tokens missing in API service, attempting to reload...');
            // Force reload tokens
            await apiService.getStoredTokens();
          }
        } catch (error) {
          console.log('❌ Error ensuring tokens loaded:', error);
        }
      };

      ensureTokensLoaded();
    }
  }, [user, isLoading]);

  // Fallback: Force login screen after 10 seconds if still loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setUser(null);
      }
    }, 10000);

    return () => clearTimeout(fallbackTimeout);
  }, [isLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);

      // Login and get tokens
      const response = await apiService.login({ email, password });
      console.log('✅ Login successful, tokens received');

      // Fetch user profile after successful login
      console.log('👤 Fetching user profile...');
      const userProfile = await apiService.getCurrentUser();
      console.log('✅ User profile fetched:', userProfile);

      // Transform backend user data to frontend format
      const transformedUser: User = {
        id: userProfile.id.toString(),
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        isOnboardingComplete: userProfile.isOnboardingComplete,
        emergencyContact: userProfile.emergencyContact,
        carePersonEmail: userProfile.carePersonEmail,
        preferences: userProfile.preferences,
        onboardingAnswers: userProfile.onboardingAnswers,
      };

      console.log('🔄 Setting user state:', transformedUser);
      console.log('📊 Onboarding status:', transformedUser.isOnboardingComplete);

      setUser(transformedUser);
      setShouldRedirectToLogin(false); // Ensure we don't redirect after successful login

      // Force a small delay to ensure state is properly set
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎉 Login completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      // Clear any partial state and force redirect
      await apiService.clearTokens();
      setUser(null);
      setShouldRedirectToLogin(true);
      setIsLoading(false); // Ensure loading is false for redirection
      console.log('🚪 Login failed, setting shouldRedirectToLogin to true');
      return false;
    } finally {
      setIsLoading(false);
      console.log('🏁 Login process finished, isLoading set to false');
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Signup now returns tokens, so we need to fetch user profile separately
      await apiService.signup({ email, name, password });

      // Fetch user profile after successful signup
      const userProfile = await apiService.getCurrentUser();

      // Transform backend user data to frontend format
      const transformedUser: User = {
        id: userProfile.id.toString(),
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        isOnboardingComplete: userProfile.isOnboardingComplete,
        emergencyContact: userProfile.emergencyContact,
        carePersonEmail: userProfile.carePersonEmail,
        preferences: userProfile.preferences,
        onboardingAnswers: userProfile.onboardingAnswers,
      };

      setUser(transformedUser);
      setShouldRedirectToLogin(false); // Ensure we don't redirect after successful signup
      console.log('🚪 Signup successful, setting shouldRedirectToLogin to false');
      return true;
    } catch (error) {
      console.error('❌ Signup error:', error);
      await apiService.clearTokens(); // Clear any partial state
      setUser(null); // Clear user state
      setShouldRedirectToLogin(true); // Ensure redirection on signup failure
      setIsLoading(false); // Ensure loading is false for redirection
      console.log('🚪 Signup failed, setting shouldRedirectToLogin to true');
      return false;
    } finally {
      setIsLoading(false);
      console.log('🏁 Signup process finished, isLoading set to false');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 User initiated logout...');
      // Try to logout from backend (blacklist token)
      await apiService.logout();
      console.log('✅ Backend logout completed');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if backend call fails
    } finally {
      // Always clear tokens and user state
      await apiService.clearTokens();
      setUser(null);
      setShouldRedirectToLogin(true);
      setIsLoading(false); // Ensure loading is false for redirection
      console.log('✅ User logged out successfully, redirecting to login');
    }
  };

  const forceLogout = async (): Promise<void> => {
    console.log('🔄 Force logout initiated');
    setIsLoading(true);
    try {
      // Clear all tokens and user state
      await apiService.clearTokens();
      setUser(null);
      console.log('✅ Force logout completed');
    } catch (error) {
      console.error('❌ Force logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (answers: Record<string, any>): Promise<void> => {
    if (!user) return;

    try {
      const onboardingData: OnboardingData = {
        emergency_contact_name: answers.emergency_contact_name,
        emergency_contact_email: answers.emergency_contact_email,
        emergency_contact_relationship: answers.emergency_contact_relationship,
        care_person_email: answers.care_person_email,
        checkin_frequency: answers.checkin_frequency,
        daily_struggles: answers.daily_struggles,
        coping_mechanisms: answers.coping_mechanisms,
        stress_level: answers.stress_level,
        sleep_quality: answers.sleep_quality,
        app_goals: answers.app_goals,
      };

      const updatedUserData = await apiService.completeOnboarding(onboardingData);

      // Transform and update user
      const updatedUser: User = {
        ...user,
        isOnboardingComplete: true,
        onboardingAnswers: answers,
        emergencyContact: {
          name: answers.emergency_contact_name,
          email: answers.emergency_contact_email,
          relationship: answers.emergency_contact_relationship,
        },
        carePersonEmail: answers.care_person_email,
        preferences: {
          checkinFrequency: answers.checkin_frequency || 'Daily',
          darkMode: user.preferences?.darkMode || false,
          language: user.preferences?.language || 'en',
        },
      };

      setUser(updatedUser);
    } catch (error) {
      console.error('❌ Onboarding completion error:', error);
      // Optionally, set an error state here to display a user-friendly message
      // For now, just log and prevent app crash
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      // Transform frontend user data to backend format
      const backendUpdates: any = {};

      if (updates.name !== undefined) backendUpdates.name = updates.name;
      if (updates.role !== undefined) backendUpdates.role = updates.role;
      if (updates.emergencyContact !== undefined) {
        backendUpdates.emergency_contact_name = updates.emergencyContact.name;
        backendUpdates.emergency_contact_email = updates.emergencyContact.email;
        backendUpdates.emergency_contact_relationship = updates.emergencyContact.relationship;
      }
      if (updates.carePersonEmail !== undefined)
        backendUpdates.care_person_email = updates.carePersonEmail;

      const updatedUserData = await apiService.updateUserProfile(backendUpdates);

      // Update local user state
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('❌ User update error:', error);
      // Optionally, set an error state here to display a user-friendly message
      // For now, just log and prevent app crash
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!user) return;

    try {
      const userProfile = await apiService.getCurrentUser();

      // Transform backend user data to frontend format
      const transformedUser: User = {
        id: userProfile.id.toString(),
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        isOnboardingComplete: userProfile.isOnboardingComplete,
        emergencyContact: userProfile.emergencyContact,
        carePersonEmail: userProfile.carePersonEmail,
        preferences: userProfile.preferences,
        onboardingAnswers: userProfile.onboardingAnswers,
      };

      setUser(transformedUser);
    } catch (error) {
      console.error('❌ User refresh error:', error);
      // If refresh fails, it likely means tokens are invalid, so force logout
      await apiService.clearTokens();
      setUser(null);
      setShouldRedirectToLogin(true);
      setIsLoading(false); // Ensure loading is false for redirection
      console.log('🚪 User refresh failed, setting shouldRedirectToLogin to true');
    }
  };

  const value: UserContextType = {
    user,
    isLoading,
    shouldRedirectToLogin,
    login,
    signup,
    logout,
    forceLogout,
    validateTokens,
    completeOnboarding,
    updateUser,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
