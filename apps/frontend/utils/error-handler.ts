/**
 * Simple error handling utilities for the frontend.
 * Provides human-friendly error messages and consistent error handling.
 */

import { Alert } from 'react-native';
import { ApiError } from '../services/api-client';

/**
 * Show a user-friendly error message
 */
export function showError(error: ApiError | Error | string, title: string = 'Oops!'): void {
  let message: string;

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = error.message || 'Something went wrong. Please try again.';
  }

  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Show a success message
 */
export function showSuccess(message: string, title: string = 'Success!'): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Show a confirmation dialog
 */
export function showConfirmation(
  message: string,
  onConfirm: () => void,
  title: string = 'Confirm'
): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: onConfirm },
  ]);
}

/**
 * Get a user-friendly error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.detail) {
    return error.detail;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Log errors in development mode
 */
export function logError(error: any, context?: string): void {
  if (__DEV__) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}
