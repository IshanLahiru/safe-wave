import React from 'react';
import { TouchableOpacity, Text, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Spacing, BorderRadius } from '../../constants/Colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  disabled = false,
}: GradientButtonProps) {
  const getButtonStyle = () => {
    if (disabled) {
      return [styles.base, styles[size], styles.disabled, style];
    }

    switch (variant) {
      case 'primary':
        return [styles.base, styles[size], styles.primary, style];
      case 'secondary':
        return [styles.base, styles[size], styles.secondary, style];
      case 'success':
        return [styles.base, styles[size], styles.success, style];
      case 'danger':
        return [styles.base, styles[size], styles.danger, style];
      default:
        return [styles.base, styles[size], styles.primary, style];
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return [styles.base, styles[`${size}Text`], styles.disabledText];
    }

    switch (variant) {
      case 'secondary':
        return [styles.text, styles[`${size}Text`], styles.secondaryText];
      default:
        return [styles.text, styles[`${size}Text`], styles.primaryText];
    }
  };

  const getGradientColors = () => {
    if (disabled) return [Colors.dark.disabled, Colors.dark.disabled];

    switch (variant) {
      case 'primary':
        return ['#0EA5E9', '#0284C7'];
      case 'secondary':
        return ['transparent', 'transparent'];
      case 'success':
        return ['#10B981', '#059669'];
      case 'danger':
        return ['#EF4444', '#DC2626'];
      default:
        return ['#0EA5E9', '#0284C7'];
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={getButtonStyle()}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={getTextStyle()}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  small: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    minHeight: 56,
  },
  primary: {
    backgroundColor: Colors.dark.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  success: {
    backgroundColor: Colors.dark.success,
  },
  danger: {
    backgroundColor: Colors.dark.danger,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.dark.background,
  },
  secondaryText: {
    color: Colors.dark.primary,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabled: {
    backgroundColor: Colors.dark.disabled,
    opacity: 0.6,
  },
  disabledText: {
    color: Colors.dark.muted,
  },
});
