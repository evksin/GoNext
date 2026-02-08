import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';

export default function SettingsScreen() {
  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title="Настройки" />

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
