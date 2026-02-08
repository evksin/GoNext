import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';

import { ScreenBackground } from '../src/components/ScreenBackground';
import { AppHeader } from '../src/components/AppHeader';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title="GoNext" showBack={false} showHome={false} />

        <View style={styles.content}>
          <Button
            mode="contained"
            onPress={() => router.push('/places')}
            style={styles.button}
          >
            Места
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/trips')}
            style={styles.button}
          >
            Поездки
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/next-place')}
            style={styles.button}
          >
            Следующее место
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/settings')}
            style={styles.button}
          >
            Настройки
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/search')}
            style={styles.button}
          >
            Поиск
          </Button>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
