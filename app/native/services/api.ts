import { API_CONFIG, ERROR_MESSAGES } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Platform detection utility
const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Storage keys for tokens
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'safe_wave_access_token',
  REFRESH_TOKEN: 'safe_wave_refresh_token',
  TOKEN_EXPIRY: 'safe_wave_token_expiry',
} as const;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface OnboardingData {
  emergency_contact_name: string;
  emergency_contact_email: string;
  emergency_contact_relationship: string;
  care_person_email?: string;
  checkin_frequency?: string;
  daily_struggles?: string;
  coping_mechanisms?: string;
  stress_level?: number;
  sleep_quality?: number;
  app_goals?: string;
}

export interface UserPreferences {
  checkinFrequency?: string;
  darkMode?: boolean;
  language?: string;
}

export interface AudioAnalysis {
  id: number;
  userId: number;
  audioFilePath: string;
  audioDuration?: number;
  fileSize?: number;
  transcription?: string;
  transcriptionConfidence?: number;
  llmAnalysis?: any;
  riskLevel?: string;
  mentalHealthIndicators?: any;
  alertSent: boolean;
  alertSentAt?: string;
  carePersonNotified: boolean;
  createdAt: string;
  analyzedAt?: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private tokenExpiry: number | null = null;

  // Authentication state management
  private authStateListeners: Array<(isAuthenticated: boolean) => void> = [];
  private isAuthenticated: boolean = false;

  setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshTokenValue = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
    // Store tokens in AsyncStorage for persistence
    this.storeTokens(accessToken, refreshToken, expiresIn);
    // Update authentication state
    this.updateAuthState(true);
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    this.storeAccessToken(token);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshTokenValue = null;
    this.tokenExpiry = null;
    // Remove tokens from AsyncStorage
    this.removeStoredTokens();
    // Update authentication state
    this.updateAuthState(false);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }

  // Authentication state management methods
  addAuthStateListener(listener: (isAuthenticated: boolean) => void) {
    this.authStateListeners.push(listener);
    // Immediately call with current state
    listener(this.isAuthenticated);
  }

  removeAuthStateListener(listener: (isAuthenticated: boolean) => void) {
    const index = this.authStateListeners.indexOf(listener);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  private updateAuthState(isAuthenticated: boolean) {
    this.isAuthenticated = isAuthenticated;
    // Notify all listeners
    this.authStateListeners.forEach(listener => listener(isAuthenticated));
  }

  getAuthState(): boolean {
    return this.isAuthenticated;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  async getStoredTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      // Web environment fallback - use localStorage
      if (Platform.OS === 'web') {
        try {
          const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          const expiryStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

          if (expiryStr) {
            this.tokenExpiry = parseInt(expiryStr, 10);
          }

          // Update in-memory tokens
          this.accessToken = accessToken;
          this.refreshTokenValue = refreshToken;

          // Validate token format (basic check)
          const isValidAccessToken =
            accessToken && accessToken.length > 50 && accessToken.includes('.');
          const isValidRefreshToken =
            refreshToken && refreshToken.length > 50 && refreshToken.includes('.');

          console.log('🔍 Token validation (web):', {
            accessTokenValid: isValidAccessToken,
            refreshTokenValid: isValidRefreshToken,
            accessTokenLength: accessToken?.length || 0,
            refreshTokenLength: refreshToken?.length || 0,
          });

          const hasValidTokens = Boolean(isValidAccessToken && isValidRefreshToken);
          this.updateAuthState(hasValidTokens);

          return {
            accessToken: isValidAccessToken ? accessToken : null,
            refreshToken: isValidRefreshToken ? refreshToken : null,
          };
        } catch (webError) {
          console.log('⚠️ Web localStorage failed, falling back to in-memory tokens');
          return {
            accessToken: this.accessToken,
            refreshToken: this.refreshTokenValue,
          };
        }
      }

      // Native environment - use AsyncStorage
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      // Also load expiry time
      const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (expiryStr) {
        this.tokenExpiry = parseInt(expiryStr, 10);
      }

      // Update in-memory tokens
      this.accessToken = accessToken;
      this.refreshTokenValue = refreshToken;

      // Validate token format (basic check)
      const isValidAccessToken =
        accessToken && accessToken.length > 50 && accessToken.includes('.');
      const isValidRefreshToken =
        refreshToken && refreshToken.length > 50 && refreshToken.includes('.');

      console.log('🔍 Token validation (native):', {
        accessTokenValid: isValidAccessToken,
        refreshTokenValid: isValidRefreshToken,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0,
      });

      // Return only valid tokens
      // Update authentication state based on token validity
      const hasValidTokens = Boolean(isValidAccessToken && isValidRefreshToken);
      this.updateAuthState(hasValidTokens);

      return {
        accessToken: isValidAccessToken ? accessToken : null,
        refreshToken: isValidRefreshToken ? refreshToken : null,
      };
    } catch (error) {
      console.error('❌ Error loading stored tokens:', error);
      this.updateAuthState(false);
      return { accessToken: null, refreshToken: null };
    }
  }

  private async storeTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    try {
      const expiry = Date.now() + expiresIn * 1000;

      // Web environment - use localStorage
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
        } catch (webError) {
          console.log('⚠️ Web localStorage failed, using in-memory storage only');
        }
      } else {
        // Native environment - use AsyncStorage
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString()),
        ]);
      }

      // Update in-memory tokens
      this.accessToken = accessToken;
      this.refreshTokenValue = refreshToken;
      this.tokenExpiry = expiry;
    } catch (error) {
      console.error('Error storing tokens:', error);
      // Fallback to in-memory storage
      this.accessToken = accessToken;
      this.refreshTokenValue = refreshToken;
      this.tokenExpiry = Date.now() + expiresIn * 1000;
    }
  }

  private async storeAccessToken(accessToken: string) {
    try {
      // Web environment - use localStorage
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        } catch (webError) {
          console.log('⚠️ Web localStorage failed for access token');
        }
      } else {
        // Native environment - use AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      }
      this.accessToken = accessToken;
    } catch (error) {
      console.error('Error storing access token:', error);
      this.accessToken = accessToken;
    }
  }

  private async removeStoredTokens() {
    try {
      // Web environment - use localStorage
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
        } catch (webError) {
          console.log('⚠️ Web localStorage removal failed');
        }
      } else {
        // Native environment - use AsyncStorage
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
        ]);
      }
    } catch (error) {
      console.error('Error removing stored tokens:', error);
    } finally {
      // Clear from memory
      this.accessToken = null;
      this.refreshTokenValue = null;
      this.tokenExpiry = null;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    try {
      // Check network connectivity first
      if (!(await this.checkNetworkConnectivity())) {
        throw new Error('No network connection available. Please check your internet connection.');
      }

      // Only ensure valid token for authenticated endpoints (not health check)
      if (endpoint !== '/health/' && endpoint !== '/health') {
        await this.ensureValidToken();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // If unauthorized, try to refresh token once
        if (response.status === 401 && this.refreshTokenValue) {
          try {
            console.log('🔄 Received 401, attempting token refresh...');
            await this.refreshToken();
            console.log('✅ Token refreshed, retrying request...');

            // Retry the request with new token
            const retryResponse = await fetch(url, {
              ...options,
              headers: this.getHeaders(),
              signal: controller.signal,
            });

            if (retryResponse.ok) {
              console.log('✅ Request retry successful after token refresh');
              return retryResponse.json();
            } else {
              console.error('❌ Request retry failed after token refresh:', retryResponse.status);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // Refresh failed, clear tokens and throw original error
            await this.clearTokens();
          }
        }

        switch (response.status) {
          case 401:
            throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
          case 422:
            throw new Error(errorData.detail || ERROR_MESSAGES.VALIDATION_ERROR);
          case 500:
            throw new Error(errorData.detail || ERROR_MESSAGES.SERVER_ERROR);
          default:
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        throw error;
      }
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  private shouldRefreshToken(): boolean {
    // Refresh token if it expires in the next 5 minutes
    if (!this.tokenExpiry) return false;
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return this.tokenExpiry <= fiveMinutesFromNow;
  }

  private async ensureValidToken(): Promise<void> {
    try {
      // Check if token is expired
      if (this.isTokenExpired()) {
        console.log('🔄 Token is expired, attempting to refresh...');
        if (this.refreshTokenValue) {
          try {
            await this.refreshToken();
            console.log('✅ Token refreshed successfully');
          } catch (error) {
            console.error('❌ Failed to refresh expired token:', error);
            await this.clearTokens();
            throw new Error('Authentication expired. Please log in again.');
          }
        } else {
          console.log('❌ No refresh token available, clearing tokens');
          await this.clearTokens();
          throw new Error('Authentication expired. Please log in again.');
        }
      } else if (this.shouldRefreshToken() && this.refreshTokenValue) {
        try {
          console.log('🔄 Token needs refresh, attempting to refresh...');
          await this.refreshToken();
          console.log('✅ Token refreshed successfully');
        } catch (error) {
          console.error('❌ Failed to refresh token:', error);
          // Clear tokens if refresh fails
          await this.clearTokens();
          throw new Error('Authentication expired. Please log in again.');
        }
      }
    } catch (error) {
      console.error('❌ Error in ensureValidToken:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    try {
      // Check network connectivity first
      if (!(await this.checkNetworkConnectivity())) {
        throw new Error(
          'No network connection. Please check your internet connection and try again.'
        );
      }

      // Skip token validation for login endpoint
      const url = `${API_CONFIG.BASE_URL}/auth/login`;
      console.log('🔐 Attempting login to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Login request timed out. Please check your connection and try again.');
        }
        if (error.message.includes('Network request failed')) {
          throw new Error('Cannot connect to server. Please check if the backend is running.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during login.');
    }
  }

  async refreshToken(): Promise<TokenResponse> {
    if (!this.refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Attempting token refresh...');

    try {
      // Skip token validation for refresh endpoint
      const url = `${API_CONFIG.BASE_URL}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshTokenValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Token refresh failed:', response.status, errorData);
        throw new Error(errorData.detail || `Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Token refresh successful, setting new tokens');
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      return data;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  }

  // Manual token refresh for testing
  async manualRefreshToken(): Promise<boolean> {
    try {
      console.log('🧪 Manual token refresh triggered...');
      await this.refreshToken();
      console.log('✅ Manual token refresh successful');
      return true;
    } catch (error) {
      console.error('❌ Manual token refresh failed:', error);
      return false;
    }
  }

  // Debug method to check token status
  getTokenStatus(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    shouldRefresh: boolean;
    expiryTime: number | null;
    timeUntilExpiry: number | null;
  } {
    const now = Date.now();
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshTokenValue,
      isExpired: this.isTokenExpired(),
      shouldRefresh: this.shouldRefreshToken(),
      expiryTime: this.tokenExpiry,
      timeUntilExpiry: this.tokenExpiry ? this.tokenExpiry - now : null,
    };
  }

  async signup(userData: SignupRequest): Promise<TokenResponse> {
    try {
      // Check network connectivity first
      if (!(await this.checkNetworkConnectivity())) {
        throw new Error(
          'No network connection. Please check your internet connection and try again.'
        );
      }

      // Skip token validation for signup endpoint
      const url = `${API_CONFIG.BASE_URL}/auth/signup`;
      console.log('🔐 Attempting signup to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Signup failed: ${response.status}`);
      }

      const data = await response.json();
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Signup request timed out. Please check your connection and try again.');
        }
        if (error.message.includes('Network request failed')) {
          throw new Error('Cannot connect to server. Please check if the backend is running.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during signup.');
    }
  }

  async logout(): Promise<void> {
    try {
      // Try to call backend logout endpoint
      if (this.accessToken) {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.log('Backend logout failed, but continuing with local cleanup:', error);
    } finally {
      // Always clear tokens locally, regardless of backend response
      console.log('🧹 Clearing local tokens and auth state');
      this.clearTokens();
    }
  }

  // Test connection to find working backend URL
  async testConnection(): Promise<{ working: boolean; url?: string; error?: string }> {
    const { FALLBACK_URLS } = await import('./config');

    for (const url of FALLBACK_URLS) {
      try {
        console.log(`🔍 Testing connection to: ${url}`);
        const response = await fetch(`${url}/health/`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          console.log(`✅ Connection successful to: ${url}`);
          return { working: true, url };
        }
      } catch (error) {
        console.log(`❌ Connection failed to: ${url}:`, error);
      }
    }

    return { working: false, error: 'No working backend URL found' };
  }

  // Force reload tokens from storage
  async forceReloadTokens(): Promise<boolean> {
    try {
      console.log('🔄 Force reloading tokens from storage...');
      console.log('🌐 Platform:', Platform.OS);

      const { accessToken, refreshToken } = await this.getStoredTokens();

      if (accessToken && refreshToken) {
        console.log('✅ Tokens reloaded successfully');
        return true;
      } else {
        console.log('❌ No tokens found in storage');
        return false;
      }
    } catch (error) {
      console.error('❌ Error force reloading tokens:', error);
      return false;
    }
  }

  // Platform-specific storage utility
  private async storageOperation<T>(
    operation: 'get' | 'set' | 'remove',
    key: string,
    value?: string
  ): Promise<T | null> {
    try {
      if (isWeb) {
        // Web environment
        switch (operation) {
          case 'get':
            return localStorage.getItem(key) as T;
          case 'set':
            if (value) localStorage.setItem(key, value);
            return null;
          case 'remove':
            localStorage.removeItem(key);
            return null;
        }
      } else if (isMobile) {
        // Mobile environment
        switch (operation) {
          case 'get':
            return (await AsyncStorage.getItem(key)) as T;
          case 'set':
            if (value) await AsyncStorage.removeItem(key);
            return null;
        }
      }
      return null;
    } catch (error) {
      console.error(`❌ Storage operation failed (${operation}):`, error);
      return null;
    }
  }

  // Check storage availability
  async checkStorageAvailability(): Promise<{
    platform: string;
    storageAvailable: boolean;
    storageType: string;
    testResult: boolean;
  }> {
    try {
      const testKey = '__storage_test__';
      const testValue = 'test_value';

      if (isWeb) {
        // Test localStorage
        try {
          localStorage.setItem(testKey, testValue);
          const retrieved = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);

          return {
            platform: 'web',
            storageAvailable: true,
            storageType: 'localStorage',
            testResult: retrieved === testValue,
          };
        } catch (error) {
          return {
            platform: 'web',
            storageAvailable: false,
            storageType: 'localStorage',
            testResult: false,
          };
        }
      } else if (isMobile) {
        // Test AsyncStorage
        try {
          await AsyncStorage.setItem(testKey, testValue);
          const retrieved = await AsyncStorage.getItem(testKey);
          await AsyncStorage.removeItem(testKey);

          return {
            platform: 'mobile',
            storageAvailable: true,
            storageType: 'AsyncStorage',
            testResult: retrieved === testValue,
          };
        } catch (error) {
          return {
            platform: 'mobile',
            storageAvailable: false,
            storageType: 'AsyncStorage',
            testResult: false,
          };
        }
      }

      return {
        platform: 'unknown',
        storageAvailable: false,
        storageType: 'none',
        testResult: false,
      };
    } catch (error) {
      console.error('❌ Storage availability check failed:', error);
      return {
        platform: Platform.OS,
        storageAvailable: false,
        storageType: 'error',
        testResult: false,
      };
    }
  }

  // User endpoints
  async getCurrentUser(): Promise<any> {
    return this.request('/users/me');
  }

  async updateUserProfile(updates: any): Promise<any> {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async completeOnboarding(onboardingData: OnboardingData): Promise<any> {
    return this.request('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData),
    });
  }

  async updateUserPreferences(preferences: UserPreferences): Promise<any> {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Audio endpoints
  async uploadAudio(formData: FormData): Promise<AudioAnalysis> {
    const url = `${API_CONFIG.BASE_URL}/audio/upload`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      // Debug: Log what's being sent
      console.log('🌐 API uploadAudio - URL:', url);
      console.log('🌐 API uploadAudio - FormData debugging:');

      // React Native doesn't support FormData.entries(), so we log differently
      if (Platform.OS === 'web') {
        // Web platform - can use entries() safely
        try {
          console.log('🌐 Web platform - logging FormData entries:');
          for (let [key, value] of (formData as any).entries()) {
            console.log(`  ${key}:`, value);
            console.log(`  ${key} type:`, typeof value);
            console.log(`  ${key} constructor:`, value?.constructor?.name);

            // Additional logging for file objects
            if (key === 'file') {
              if (value instanceof File) {
                console.log(`    File name: ${value.name}`);
                console.log(`    File size: ${value.size} bytes`);
                console.log(`    File type: ${value.type}`);
              } else {
                console.log(`    File value is not a File object:`, value);
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not iterate FormData entries on web:', error);
        }
      } else {
        // React Native platform - log individual entries
        console.log('📱 React Native platform detected');
        console.log('📱 FormData type:', typeof formData);
        console.log('📱 FormData constructor:', formData.constructor.name);

        // Log the specific entries we know about
        const fileEntry = formData.get('file');
        const descEntry = formData.get('description');
        const moodEntry = formData.get('mood_rating');

        console.log('📱 File entry:', fileEntry);
        console.log('📱 Description entry:', descEntry);
        console.log('📱 Mood rating entry:', moodEntry);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          // Don't set Content-Type for FormData - let the browser set it with boundary
          // React Native will automatically set the correct Content-Type with boundary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout. Please try again.');
        }
        throw error;
      }
      throw new Error('Upload failed');
    }
  }

  async getAudioAnalyses(): Promise<AudioAnalysis[]> {
    return this.request('/audio/list');
  }

  // Real-time status endpoints
  async getAudioStatus(audioId: number): Promise<any> {
    return this.request(`/audio/${audioId}/status`);
  }

  // WebSocket connection for real-time updates
  connectWebSocket(userId: number, onMessage: (data: any) => void): WebSocket | null {
    try {
      const wsUrl = API_CONFIG.BASE_URL.replace('http', 'ws') + `/audio/ws/${userId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected for real-time updates');
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }

  async getAudioAnalysis(analysisId: number): Promise<AudioAnalysis> {
    return this.request(`/audio/${analysisId}`);
  }

  async deleteAudioAnalysis(analysisId: number): Promise<void> {
    return this.request(`/audio/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // Test onboarding analysis (for testing purposes)
  async testOnboardingAnalysis(): Promise<any> {
    try {
      const response = await this.makeRequest('/audio/test/onboarding-analysis', {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('Test onboarding analysis error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health/');
  }

  // Check if API is available
  async isApiAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Check network connectivity
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a simple endpoint to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for connectivity check

      const response = await fetch(`${API_CONFIG.BASE_URL}/health/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('🌐 Network connectivity check failed:', error);
      return false;
    }
  }

  // Get server status with detailed error information
  async getServerStatus(): Promise<{ status: string; details: string; url: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/health/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'online',
          details: 'Backend server is running and accessible',
          url: API_CONFIG.BASE_URL,
        };
      } else {
        return {
          status: 'error',
          details: `Server responded with status: ${response.status}`,
          url: API_CONFIG.BASE_URL,
        };
      }
    } catch (error) {
      return {
        status: 'offline',
        details: error instanceof Error ? error.message : 'Network request failed',
        url: API_CONFIG.BASE_URL,
      };
    }
  }
}

export const apiService = new ApiService();

// Initialize tokens from storage when the service is imported
apiService.getStoredTokens().catch(error => {
  console.error('Failed to initialize tokens from storage:', error);
});

export default apiService;
