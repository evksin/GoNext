import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { PlaceForm } from '../../src/screens/PlaceForm';

export default function PlaceCreateScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title="Новое место" />

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
