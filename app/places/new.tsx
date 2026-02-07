import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { PlaceForm } from '../../src/screens/PlaceForm';

export default function PlaceCreateScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Новое место" />
        </Appbar.Header>

        <PlaceForm onSaved={() => router.back()} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
