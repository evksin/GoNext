import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AppHeader } from '../../../src/components/AppHeader';
import { PlaceForm } from '../../../src/screens/PlaceForm';

export default function PlaceEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const placeId = params.id ? Number(params.id) : null;

  if (!placeId || Number.isNaN(placeId)) {
    return (
      <ScreenBackground>
        <View style={styles.screen}>
          <AppHeader title={t('places.editTitle')} />
          <View style={styles.center}>
            <Text>{t('places.invalidId')}</Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('places.editTitle')} />

        <PlaceForm placeId={placeId} onSaved={() => router.back()} />
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
