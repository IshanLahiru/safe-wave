/**
 * Simple, clean API client for Safe Wave frontend.
 * Handles authentication, requests, and error handling in a straightforward way.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration
const API_BASE_URL = __DEV__ 
  ? (Platform.OS === 'web' ? 'http://localhost:9000' : 'http://192.168.31.123:9000')
  : 'https://your-production-api.com';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  isOnboardingComplete: boolean;
  carePersonEmail?: string;
  emergencyContactEmail?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Simple API client class with clean, human-friendly error handling
 */
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get access token
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format errors in a user-friendly way
   */
  private handleError(error: any): ApiError {
    if (error instanceof Error) {
      // Network or parsing errors
      if (error.message.includes('fetch')) {
        return {
          message: "Can't connect to the server. Please check your internet connection.",
          code: 'NETWORK_ERROR'
        };
      }
      
      // API errors
      return {
        message: error.message || 'Something went wrong. Please try again.',
        code: 'API_ERROR'
      };
    }
    
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Store authentication tokens
   */
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }

  /**
   * Clear authentication tokens
   */
  private async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }

  // Authentication methods
  
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await this.storeTokens(response.access_token, response.refresh_token);
    return response;
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    await this.storeTokens(response.access_token, response.refresh_token);
    return response;
  }

  /**
   * Logout user (clear tokens)
   */
  async logout(): Promise<void> {
    await this.clearTokens();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  /**
   * Update user's onboarding information
   */
  async updateOnboarding(data: Record<string, any>): Promise<User> {
    return this.request<User>('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Audio methods

  /**
   * Upload audio file for analysis
   */
  async uploadAudio(audioFile: File | Blob, filename: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', audioFile, filename);

    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    const response = await fetch(`${this.baseUrl}/audio/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to upload audio');
    }

    return response.json();
  }

  /**
   * Get user's audio history
   */
  async getAudioHistory(): Promise<any[]> {
    return this.request<any[]>('/audio/list');
  }

  // Health check

  /**
   * Check if the API is healthy
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health/');
  }

  /**
   * Check API configuration status
   */
  async configCheck(): Promise<any> {
    return this.request<any>('/health/config');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { User, AuthResponse, ApiError };
