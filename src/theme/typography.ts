import { TextStyle } from 'react-native';

export const typography = {
  // Font Family - using system fonts as fallback for custom Inter fonts
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    light: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
    '7xl': 40,
    '8xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    xs: 12,
    sm: 16,
    base: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 44,
    '6xl': 48,
  },
  
  // Letter Spacing
  letterSpacing: {
    xs: -0.5,
    sm: -0.25,
    base: 0,
    lg: 0.25,
    xl: 0.5,
    '2xl': 0.75,
  },
};

// Predefined Text Styles
export const textStyles: Record<string, TextStyle> = {
  // Heading Styles
  heading1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.lineHeight['5xl'],
    letterSpacing: typography.letterSpacing.sm,
  },
  heading2: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight['4xl'],
    letterSpacing: typography.letterSpacing.sm,
  },
  heading3: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['3xl'],
    letterSpacing: typography.letterSpacing.xs,
  },
  heading4: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight['2xl'],
    letterSpacing: typography.letterSpacing.xs,
  },
  heading5: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.xl,
  },
  
  // Body Text Styles
  bodyLarge: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  
  // Button Text Styles
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    letterSpacing: typography.letterSpacing.xs,
  },
  buttonTextSmall: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    letterSpacing: typography.letterSpacing.xs,
  },
  
  // Caption and Label Styles
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  
  // Special Styles
  price: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['2xl'],
  },
  badge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    letterSpacing: typography.letterSpacing.xs,
  },
};

export type TextStyles = keyof typeof textStyles;
