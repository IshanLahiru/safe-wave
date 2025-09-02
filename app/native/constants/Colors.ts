/**
 * Modern dark theme color system
 * Professional, minimal, and consistent design
 */

export const Colors = {
  light: {
    // Light theme (keeping for compatibility but focusing on dark)
    text: '#1a1a1a',
    background: '#ffffff',
    tint: '#0EA5E9',
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#0EA5E9',
    primary: '#0EA5E9', // Vivid blue/cyan
    secondary: '#9CA3AF', // Neutral gray
    accent: '#0EA5E9', // Primary accent
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    muted: '#6B7280', // Muted gray
    border: '#E5E7EB',
    card: '#ffffff',
    surface: '#F9FAFB',
  },
  dark: {
    // Primary dark theme
    text: '#F9FAFB', // White text
    background: '#121212', // Dark background
    tint: '#0EA5E9', // Primary accent
    icon: '#9CA3AF', // Secondary accent
    tabIconDefault: '#6B7280', // Muted
    tabIconSelected: '#0EA5E9', // Primary accent
    primary: '#0EA5E9', // Vivid blue/cyan
    secondary: '#9CA3AF', // Neutral gray
    accent: '#0EA5E9', // Primary accent
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    muted: '#6B7280', // Muted gray
    border: '#2C2C2C', // Subtle border
    card: '#1E1E1E', // Card background
    surface: '#1F2937', // Modal/surface background
    inputBackground: '#1E1E1E', // Input background
    disabled: '#2A2A2A', // Disabled state
    hover: '#1F2937', // Hover state
  },
};

export const Gradients = {
  primary: ['#0EA5E9', '#0284C7'] as const,
  secondary: ['#1E1E1E', '#2C2C2C'] as const,
  surface: ['#1F2937', '#374151'] as const,
  success: ['#10B981', '#059669'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 12, // 0.75rem
  lg: 16,
  xl: 20,
  full: 9999,
};
