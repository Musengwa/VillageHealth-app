/**
 * The palette stays light in both device modes so the app keeps the requested
 * green-and-white look instead of switching to a dark green theme.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2ca44f';
const tintColorDark = '#2ca44f';

export const Colors = {
  light: {
    text: '#153321',
    background: '#f8fff8',
    tint: tintColorLight,
    icon: '#78a286',
    tabIconDefault: '#78a286',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#153321',
    background: '#f8fff8',
    tint: tintColorDark,
    icon: '#78a286',
    tabIconDefault: '#78a286',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
