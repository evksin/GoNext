import { MD3LightTheme } from 'react-native-paper';

export const paperTheme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontSize: 34, lineHeight: 40 },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, fontSize: 30, lineHeight: 36 },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, fontSize: 26, lineHeight: 32 },
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontSize: 24, lineHeight: 30 },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontSize: 22, lineHeight: 28 },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, fontSize: 20, lineHeight: 26 },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontSize: 22, lineHeight: 28 },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontSize: 20, lineHeight: 26 },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, fontSize: 18, lineHeight: 24 },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontSize: 16, lineHeight: 22 },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontSize: 14, lineHeight: 20 },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, fontSize: 12, lineHeight: 18 },
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontSize: 18, lineHeight: 24 },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontSize: 16, lineHeight: 22 },
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, fontSize: 14, lineHeight: 20 },
  },
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
  },
};
