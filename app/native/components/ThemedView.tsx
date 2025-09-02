import { View, type ViewProps } from 'react-native';
import { Colors } from '../constants/Colors';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'card' | 'surface' | 'transparent';
};

export function ThemedView({ style, variant = 'background', ...otherProps }: ThemedViewProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'card':
        return Colors.dark.card;
      case 'surface':
        return Colors.dark.surface;
      case 'transparent':
        return 'transparent';
      default:
        return Colors.dark.background;
    }
  };

  return <View style={[{ backgroundColor: getBackgroundColor() }, style]} {...otherProps} />;
}
