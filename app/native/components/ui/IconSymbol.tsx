// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'checkmark.circle.fill': 'check-circle',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'location.fill': 'location-on',
  'chart.bar.fill': 'bar-chart',
  'person.fill': 'person',
  'mic.fill': 'mic',
  'stop.fill': 'stop',
  'play.fill': 'play-arrow',
  'wave.3.right': 'waves',
  'sun.max.fill': 'wb-sunny',
  'arrow.right': 'arrow-forward',
  'message.fill': 'chat',
  calendar: 'calendar-today',
  'square.and.arrow.up': 'share',
  'arrow.up.right': 'trending-up',
  'star.fill': 'star',
  'exclamationmark.triangle.fill': 'warning',
  target: 'gps-fixed',
  globe: 'language',
  'heart.fill': 'favorite',
  'chevron.left': 'chevron-left',
  checkmark: 'check',
  'doc.text.fill': 'description',
  'doc.plaintext.fill': 'description',
  'person.circle.fill': 'account-circle',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'questionmark.circle.fill': 'help',
  'envelope.fill': 'email',
  'info.circle.fill': 'info',
  'rectangle.portrait.and.arrow.right': 'logout',
  waveform: 'graphic-eq',
  'person.badge.plus': 'person-add',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  xmark: 'close',
  'arrow.up.doc': 'file-upload',
  'doc.text': 'description',
  'laptopcomputer': 'laptop',
  'brain.head.profile': 'psychology',
  'heart.text.square': 'favorite',
  'paintbrush.pointed': 'brush',
  'phone.fill': 'phone',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'list.bullet': 'list',
  'play.circle.fill': 'play-circle-filled',
  'wrench.fill': 'build',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  onPress,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
  onPress?: () => void;
}) {
  return (
    <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} onPress={onPress} />
  );
}
