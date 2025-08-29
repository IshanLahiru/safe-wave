import { API_CONFIG, ERROR_MESSAGES } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
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
      // Load tokens from AsyncStorage
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
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
      const isValidAccessToken = accessToken && accessToken.length > 50 && accessToken.includes('.');
      const isValidRefreshToken = refreshToken && refreshToken.length > 50 && refreshToken.includes('.');

      console.log('🔍 Token validation:', {
        accessTokenValid: isValidAccessToken,
        refreshTokenValid: isValidRefreshToken,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });

      // Return only valid tokens
                        // Update authentication state based on token validity
                  const hasValidTokens = Boolean(isValidAccessToken && isValidRefreshToken);
                  this.updateAuthState(hasValidTokens);
                  
                  return {
                    accessToken: isValidAccessToken ? accessToken : null,
                    refreshToken: isValidRefreshToken ? refreshToken : null
                  };
                } catch (error) {
                  console.error('❌ Error loading stored tokens:', error);
                  this.updateAuthState(false);
                  return { accessToken: null, refreshToken: null };
                }
              }

  private async storeTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    try {
      const expiry = Date.now() + (expiresIn * 1000);
      
      // Store tokens in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString())
      ]);

      // Update in-memory tokens
      this.accessToken = accessToken;
      this.refreshTokenValue = refreshToken;
      this.tokenExpiry = expiry;
    } catch (error) {
      console.error('Error storing tokens:', error);
      // Fallback to in-memory storage
      this.accessToken = accessToken;
      this.refreshTokenValue = refreshToken;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);
    }
  }

  private async storeAccessToken(accessToken: string) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      this.accessToken = accessToken;
    } catch (error) {
      console.error('Error storing access token:', error);
      this.accessToken = accessToken;
    }
  }

  private async removeStoredTokens() {
    try {
      // Remove tokens from AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY)
      ]);
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    try {
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
            console.log('Received 401, attempting token refresh...');
            await this.refreshToken();
            // Retry the request with new token
            const retryResponse = await fetch(url, {
              ...options,
              headers: this.getHeaders(),
              signal: controller.signal,
            });
            
            if (retryResponse.ok) {
              console.log('Request retry successful after token refresh');
              return retryResponse.json();
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
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
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return this.tokenExpiry <= fiveMinutesFromNow;
  }

  private async ensureValidToken(): Promise<void> {
    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('Token is expired, attempting to refresh...');
      if (this.refreshTokenValue) {
        try {
          await this.refreshToken();
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Failed to refresh expired token:', error);
          await this.clearTokens();
          throw new Error('Authentication expired. Please log in again.');
        }
      } else {
        console.log('No refresh token available, clearing tokens');
        await this.clearTokens();
        throw new Error('Authentication expired. Please log in again.');
      }
    } else if (this.shouldRefreshToken() && this.refreshTokenValue) {
      try {
        console.log('Token needs refresh, attempting to refresh...');
        await this.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Clear tokens if refresh fails
        await this.clearTokens();
        throw new Error('Authentication expired. Please log in again.');
      }
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    // Skip token validation for login endpoint
    const url = `${API_CONFIG.BASE_URL}/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
  }

  async refreshToken(): Promise<TokenResponse> {
    if (!this.refreshTokenValue) {
      throw new Error('No refresh token available');
    }

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
      throw new Error(errorData.detail || `Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
  }

  async signup(userData: SignupRequest): Promise<TokenResponse> {
    // Skip token validation for signup endpoint
    const url = `${API_CONFIG.BASE_URL}/auth/signup`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Signup failed: ${response.status}`);
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          // Don't set Content-Type for FormData
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
    return this.request('/audio/analyses');
  }

  async getAudioAnalysis(analysisId: number): Promise<AudioAnalysis> {
    return this.request(`/audio/analyses/${analysisId}`);
  }

  async deleteAudioAnalysis(analysisId: number): Promise<void> {
    return this.request(`/audio/analyses/${analysisId}`, {
      method: 'DELETE',
    });
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
}

export const apiService = new ApiService();

// Initialize tokens from storage when the service is imported
apiService.getStoredTokens().catch(error => {
  console.error('Failed to initialize tokens from storage:', error);
});

export default apiService;
