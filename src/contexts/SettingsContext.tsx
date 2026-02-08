import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  createPaperTheme,
  FontScale,
  PrimaryColor,
  ThemeMode,
} from '../theme/paperTheme';

type SettingsContextValue = {
  themeMode: ThemeMode;
  fontScale: FontScale;
  primaryColor: PrimaryColor;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
  theme: ReturnType<typeof createPaperTheme>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [fontScale, setFontScale] = useState<FontScale>('large');
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>('#2E7D32');

  const theme = useMemo(
    () => createPaperTheme(themeMode, fontScale, primaryColor),
    [themeMode, fontScale, primaryColor]
  );

  const value = useMemo(
    () => ({
      themeMode,
      fontScale,
      primaryColor,
      setThemeMode,
      setFontScale,
      setPrimaryColor,
      theme,
    }),
    [theme, themeMode, fontScale, primaryColor]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return context;
};
