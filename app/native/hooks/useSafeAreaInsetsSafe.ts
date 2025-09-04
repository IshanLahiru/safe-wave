import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Safe wrapper for useSafeAreaInsets that handles web environment issues
 * where window.addEventListener might not be available
 */
export function useSafeAreaInsetsSafe() {
  try {
    return useSafeAreaInsets();
  } catch (error) {
    console.warn('useSafeAreaInsets failed, using default values:', error);
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}
