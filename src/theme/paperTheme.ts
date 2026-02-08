import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';
export type FontScale = 'normal' | 'large';

export const PRIMARY_COLORS = [
  '#2E7D32',
  '#1E88E5',
  '#6A1B9A',
  '#C62828',
  '#EF6C00',
  '#00897B',
  '#5D4037',
  '#546E7A',
  '#F9A825',
  '#3949AB',
] as const;

export type PrimaryColor = (typeof PRIMARY_COLORS)[number];

const scaleFont = (
  value: number,
  scale: FontScale
): number => (scale === 'large' ? Math.round(value * 1.25) : value);

const buildFonts = (base: typeof MD3LightTheme, scale: FontScale) => ({
  ...base.fonts,
  displayLarge: {
    ...base.fonts.displayLarge,
    fontSize: scaleFont(34, scale),
    lineHeight: scaleFont(40, scale),
  },
  displayMedium: {
    ...base.fonts.displayMedium,
    fontSize: scaleFont(30, scale),
    lineHeight: scaleFont(36, scale),
  },
  displaySmall: {
    ...base.fonts.displaySmall,
    fontSize: scaleFont(26, scale),
    lineHeight: scaleFont(32, scale),
  },
  headlineLarge: {
    ...base.fonts.headlineLarge,
    fontSize: scaleFont(24, scale),
    lineHeight: scaleFont(30, scale),
  },
  headlineMedium: {
    ...base.fonts.headlineMedium,
    fontSize: scaleFont(22, scale),
    lineHeight: scaleFont(28, scale),
  },
  headlineSmall: {
    ...base.fonts.headlineSmall,
    fontSize: scaleFont(20, scale),
    lineHeight: scaleFont(26, scale),
  },
  titleLarge: {
    ...base.fonts.titleLarge,
    fontSize: scaleFont(22, scale),
    lineHeight: scaleFont(28, scale),
  },
  titleMedium: {
    ...base.fonts.titleMedium,
    fontSize: scaleFont(20, scale),
    lineHeight: scaleFont(26, scale),
  },
  titleSmall: {
    ...base.fonts.titleSmall,
    fontSize: scaleFont(18, scale),
    lineHeight: scaleFont(24, scale),
  },
  labelLarge: {
    ...base.fonts.labelLarge,
    fontSize: scaleFont(16, scale),
    lineHeight: scaleFont(22, scale),
  },
  labelMedium: {
    ...base.fonts.labelMedium,
    fontSize: scaleFont(14, scale),
    lineHeight: scaleFont(20, scale),
  },
  labelSmall: {
    ...base.fonts.labelSmall,
    fontSize: scaleFont(12, scale),
    lineHeight: scaleFont(18, scale),
  },
  bodyLarge: {
    ...base.fonts.bodyLarge,
    fontSize: scaleFont(18, scale),
    lineHeight: scaleFont(24, scale),
  },
  bodyMedium: {
    ...base.fonts.bodyMedium,
    fontSize: scaleFont(16, scale),
    lineHeight: scaleFont(22, scale),
  },
  bodySmall: {
    ...base.fonts.bodySmall,
    fontSize: scaleFont(14, scale),
    lineHeight: scaleFont(20, scale),
  },
});

export const createPaperTheme = (
  mode: ThemeMode,
  scale: FontScale,
  primaryColor: PrimaryColor
) => {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    fonts: buildFonts(base, scale),
    colors: {
      ...base.colors,
      primary: primaryColor,
    },
  };
};
