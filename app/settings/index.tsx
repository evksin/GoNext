import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import {
  Button,
  SegmentedButtons,
  Snackbar,
  Text,
} from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';
import { useSettings } from '../../src/contexts/SettingsContext';
import { PRIMARY_COLORS } from '../../src/theme/paperTheme';
import { setLanguage } from '../../src/i18n';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const {
    themeMode,
    fontScale,
    primaryColor,
    setThemeMode,
    setFontScale,
    setPrimaryColor,
  } = useSettings();
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('settings.title')} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionSubtitle}>{t('settings.language')}</Text>
          <SegmentedButtons
            value={i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru'}
            onValueChange={(value) => setLanguage(value as 'ru' | 'en')}
            buttons={[
              { value: 'ru', label: t('settings.languageRu') },
              { value: 'en', label: t('settings.languageEn') },
            ]}
          />
          <Text style={styles.sectionSubtitle}>{t('settings.appearance')}</Text>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as typeof themeMode)}
            buttons={[
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
          <Text style={styles.sectionSubtitle}>{t('settings.fontLabel')}</Text>
          <SegmentedButtons
            value={fontScale}
            onValueChange={(value) => setFontScale(value as typeof fontScale)}
            buttons={[
              { value: 'normal', label: t('settings.fontNormal') },
              { value: 'large', label: t('settings.fontLarge') },
            ]}
          />
          <Text style={styles.sectionSubtitle}>{t('settings.primaryColor')}</Text>
          <View style={styles.colorRow}>
            {PRIMARY_COLORS.map((color) => {
              const selected = color === primaryColor;
              return (
                <Pressable
                  key={color}
                  onPress={() => setPrimaryColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selected && styles.colorDotSelected,
                  ]}
                />
              );
            })}
          </View>

        </ScrollView>

        <Snackbar
          visible={Boolean(message)}
          onDismiss={() => setMessage('')}
          duration={2500}
        >
          {message}
        </Snackbar>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#000000',
  },
});
