import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const hasWindow = typeof window !== 'undefined';
export const hasWindowEvents =
  isWeb &&
  hasWindow &&
  typeof window.addEventListener === 'function' &&
  typeof window.removeEventListener === 'function';