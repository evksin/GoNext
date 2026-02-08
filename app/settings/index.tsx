import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, Text } from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Настройки" />
          <Appbar.Action icon="home" onPress={() => router.replace('/')} />
        </Appbar.Header>

        <View style={styles.content}>
          <Text>Экран настроек будет добавлен позже.</Text>
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
