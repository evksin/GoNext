import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { TripForm } from '../../src/screens/TripForm';

export default function TripCreateScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Новая поездка" />
        </Appbar.Header>

        <TripForm onSaved={() => router.back()} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
