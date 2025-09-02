// API Configuration
export const API_CONFIG = {
  // Use network IP for mobile/simulator, localhost for web development
  BASE_URL: __DEV__ ? 'http://192.168.31.14:9000' : 'http://192.168.31.14:9000', // Backend server URL for API calls
  FILE_BASE_URL: __DEV__
    ? 'http://192.168.31.14:9000/uploads'
    : 'http://192.168.31.14:9000/uploads', // Local storage URL for file access
  TIMEOUT: 30000, // 30 seconds for audio uploads
  RETRY_ATTEMPTS: 3,

  // Fallback URLs for different environments
  FALLBACK_URLS: [
    'http://192.168.31.14:9000',
    'http://localhost:9000',
    'http://10.0.2.2:9000', // Android emulator
    'http://127.0.0.1:9000',
  ],
};

// Audio Configuration
export const AUDIO_CONFIG = {
  MAX_DURATION: 300, // 5 minutes in seconds
  QUALITY: 'high', // 'low', 'medium', 'high'
  FORMAT: 'wav',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Function to get the current backend URL
export const getBackendUrl = (): string => {
  // For development, use network IP for mobile/simulator access
  if (__DEV__) {
    return 'http://192.168.31.14:9000';
  }
  return 'http://192.168.31.14:9000';
};

// Function to get the current file upload URL
export const getFileUploadUrl = (): string => {
  return `${getBackendUrl()}/uploads`;
};

// Function to test backend connectivity
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getBackendUrl()}/health/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  ONBOARDING_COMPLETE: 'Onboarding completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
};
