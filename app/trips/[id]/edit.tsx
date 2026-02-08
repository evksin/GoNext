import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, Text } from 'react-native-paper';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { TripForm } from '../../../src/screens/TripForm';

export default function TripEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = params.id ? Number(params.id) : null;

  if (!tripId || Number.isNaN(tripId)) {
    return (
      <ScreenBackground>
        <View style={styles.screen}>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Редактирование" />
            <Appbar.Action icon="home" onPress={() => router.replace('/')} />
          </Appbar.Header>
          <View style={styles.center}>
            <Text>Некорректный идентификатор поездки.</Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Редактирование поездки" />
          <Appbar.Action icon="home" onPress={() => router.replace('/')} />
        </Appbar.Header>

        <TripForm tripId={tripId} onSaved={() => router.back()} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
