import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../../src/components/AppHeader';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { TripForm } from '../../src/screens/TripForm';

export default function TripCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('trips.newTitle')} />

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
