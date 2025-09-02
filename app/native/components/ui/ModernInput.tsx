import React, { useState } from 'react';
import { TextInput, View, Text, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '../../constants/Colors';

interface ModernInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  error?: string;
  success?: boolean;
}

export function ModernInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  style,
  error,
  success
}: ModernInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    if (error) return [styles.input, styles.inputError];
    if (success) return [styles.input, styles.inputSuccess];
    if (isFocused) return [styles.input, styles.inputFocused];
    return styles.input;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={getInputStyle()}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={Colors.dark.muted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>✓ Valid</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    backgroundColor: Colors.dark.inputBackground,
    color: Colors.dark.text,
    ...Shadows.small,
  },
  inputFocused: {
    borderColor: Colors.dark.primary,
    ...Shadows.glow,
  },
  inputError: {
    borderColor: Colors.dark.danger,
  },
  inputSuccess: {
    borderColor: Colors.dark.success,
  },
  errorText: {
    fontSize: 14,
    color: Colors.dark.danger,
    marginTop: Spacing.xs,
  },
  successText: {
    fontSize: 14,
    color: Colors.dark.success,
    marginTop: Spacing.xs,
  },
});
