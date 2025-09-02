/**
 * Simple authentication context for managing user state.
 * Provides login, logout, and user state management.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User, AuthResponse } from '../services/api-client';
import { logError } from '../utils/error-handler';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /**
   * Initialize auth state on app start
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      setIsLoading(true);

      // Try to get current user (this will fail if not authenticated)
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // User is not authenticated, which is fine
      logError(error, 'Auth initialization');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response: AuthResponse = await apiClient.login(email, password);
      setUser(response.user);
    } catch (error) {
      logError(error, 'Login');
      throw error; // Re-throw so components can handle the error
    }
  }

  async function register(email: string, password: string, name: string) {
    try {
      const response: AuthResponse = await apiClient.register(email, password, name);
      setUser(response.user);
    } catch (error) {
      logError(error, 'Register');
      throw error; // Re-throw so components can handle the error
    }
  }

  async function logout() {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (error) {
      logError(error, 'Logout');
      // Even if logout fails, clear local state
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      logError(error, 'Refresh user');
      // If refresh fails, user might need to login again
      setUser(null);
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
