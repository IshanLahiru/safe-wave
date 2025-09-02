import { StyleSheet, Text, type TextProps } from 'react-native';
import { Colors } from '../constants/Colors';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'body' | 'caption' | 'link' | 'heading';
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'danger';
};

export function ThemedText({
  style,
  type = 'default',
  variant = 'primary',
  ...rest
}: ThemedTextProps) {
  const getColor = () => {
    switch (variant) {
      case 'secondary':
        return Colors.dark.secondary;
      case 'muted':
        return Colors.dark.muted;
      case 'success':
        return Colors.dark.success;
      case 'danger':
        return Colors.dark.danger;
      default:
        return Colors.dark.text;
    }
  };

  return <Text style={[{ color: getColor() }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    opacity: 0.8,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: Colors.dark.primary,
  },
});
