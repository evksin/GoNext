import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';

import { initDb } from '../src/db';
import { ensureAppDirectories } from '../src/services/storage';
import { paperTheme } from '../src/theme/paperTheme';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        await initDb();
        await ensureAppDirectories();
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
      <PaperProvider theme={paperTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
