import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { createPaperTheme, FontScale, ThemeMode } from '../theme/paperTheme';

type SettingsContextValue = {
  themeMode: ThemeMode;
  fontScale: FontScale;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  theme: ReturnType<typeof createPaperTheme>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [fontScale, setFontScale] = useState<FontScale>('large');

  const theme = useMemo(
    () => createPaperTheme(themeMode, fontScale),
    [themeMode, fontScale]
  );

  const value = useMemo(
    () => ({
      themeMode,
      fontScale,
      setThemeMode,
      setFontScale,
      theme,
    }),
    [theme, themeMode, fontScale]
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
