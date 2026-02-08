import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AppHeader } from '../../../src/components/AppHeader';
import { TripForm } from '../../../src/screens/TripForm';

export default function TripEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = params.id ? Number(params.id) : null;

  if (!tripId || Number.isNaN(tripId)) {
    return (
      <ScreenBackground>
        <View style={styles.screen}>
          <AppHeader title={t('trips.editTitle')} />
          <View style={styles.center}>
            <Text>{t('trips.invalidId')}</Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('trips.editTitle')} />

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
