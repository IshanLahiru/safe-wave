// API Configuration
export const API_CONFIG = {
  // Dynamic base URL detection for cross-platform compatibility
  BASE_URL: __DEV__ ? getDynamicBaseUrl() : 'https://api.safewave.com', // Production URL
  FILE_BASE_URL: __DEV__ ? `${getDynamicBaseUrl()}/uploads` : 'https://api.safewave.com/uploads',
  TIMEOUT: 30000, // 30 seconds for audio uploads
  RETRY_ATTEMPTS: 3,

  // Fallback URLs for different environments and platforms
  FALLBACK_URLS: [
    'http://localhost:8000',
    'http://192.168.31.14:8000',
    'http://192.168.31.14:8000', // Local network IP
    'http://192.168.31.14:8000', // Android emulator
    'http://192.168.31.14:8000', // Genymotion
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

// Dynamic base URL detection function
function getDynamicBaseUrl(): string {
  // For web development, use localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }

  // For mobile development, try to detect the best IP
  // This will be determined at runtime
  return 'http://192.168.31.14:8000'; // Default fallback
}

// Function to get the current backend URL with fallback
export const getBackendUrl = async (): Promise<string> => {
  // Try the primary URL first
  const primaryUrl = getDynamicBaseUrl();
  if (await testUrl(primaryUrl)) {
    return primaryUrl;
  }

  // Try fallback URLs
  for (const fallbackUrl of API_CONFIG.FALLBACK_URLS) {
    if (await testUrl(fallbackUrl)) {
      console.log(`✅ Using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }

  // If all fail, return the primary URL (will show error)
  console.warn('⚠️ All backend URLs failed, using primary URL');
  return primaryUrl;
};

// Test if a URL is accessible
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log(`❌ URL test failed for ${url}:`, error);
    return false;
  }
}

// Function to get the current file upload URL
export const getFileUploadUrl = async (): Promise<string> => {
  const baseUrl = await getBackendUrl();
  return `${baseUrl}/uploads`;
};

// Function to test backend connectivity
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const baseUrl = await getBackendUrl();
    const response = await fetch(`${baseUrl}/health/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (testingError) {
    console.error('Backend connection test failed:', testingError);
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
