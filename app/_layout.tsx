import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';

import { initDb } from '../src/db';
import { ensureAppDirectories } from '../src/services/storage';
import { SettingsProvider, useSettings } from '../src/contexts/SettingsContext';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        if (Platform.OS !== 'web') {
        await initDb();
        await ensureAppDirectories();
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator animating />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <RootLayoutWithTheme />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutWithTheme() {
  const { theme } = useSettings();
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
