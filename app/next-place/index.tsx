import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, Text } from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';

export default function NextPlaceScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Следующее место" />
        </Appbar.Header>

        <View style={styles.content}>
          <Text>Экран следующего места будет добавлен позже.</Text>
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
    padding: 16,
  },
});
