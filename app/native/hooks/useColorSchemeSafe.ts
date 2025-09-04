import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Safe wrapper for useColorScheme that handles web environment issues
 * where window.addEventListener might not be available
 */
export function useColorSchemeSafe() {
  try {
    return useColorScheme();
  } catch (error) {
    console.warn('useColorScheme failed, using default dark theme:', error);
    return 'dark' as const;
  }
}
