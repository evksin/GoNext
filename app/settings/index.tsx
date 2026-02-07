import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, Text } from 'react-native-paper';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Настройки" />
      </Appbar.Header>

      <View style={styles.content}>
        <Text>Экран настроек будет добавлен позже.</Text>
      </View>
    </View>
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
