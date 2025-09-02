import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '../../constants/Colors';

interface ModernCardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'surface' | 'interactive';
    style?: ViewStyle;
    padding?: 'sm' | 'md' | 'lg';
}

export function ModernCard({
    children,
    variant = 'elevated',
    style,
    padding = 'lg'
}: ModernCardProps) {
    const cardStyle = [
        styles.base,
        styles[variant],
        styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
        style,
    ];

    return (
        <View style={cardStyle}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: Colors.dark.card,
        borderRadius: BorderRadius.md,
    },
    elevated: {
        ...Shadows.medium,
        backgroundColor: Colors.dark.card,
    },
    outlined: {
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.card,
    },
    surface: {
        backgroundColor: Colors.dark.surface,
        ...Shadows.small,
    },
    interactive: {
        backgroundColor: Colors.dark.card,
        ...Shadows.small,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    paddingSm: {
        padding: Spacing.md,
    },
    paddingMd: {
        padding: Spacing.lg,
    },
    paddingLg: {
        padding: Spacing.xl,
    },
});
