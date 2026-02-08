import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Appbar,
  FAB,
  List,
  Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { listPlaces } from '../../src/data/places';
import { Place } from '../../src/models/types';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';

export default function PlacesListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlaces();
      setPlaces(data);
    } catch {
      setError(t('places.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces])
  );

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader
          title={t('places.title')}
          rightActions={
            <Appbar.Action
              icon="plus"
              onPress={() => router.push('/places/new')}
            />
          }
        />

        <View style={styles.content}>
          {loading && <ActivityIndicator />}

          {!loading && error && <Text>{error}</Text>}

          {!loading && !error && places.length === 0 && (
            <Text>{t('places.listEmpty')}</Text>
          )}

          {!loading && !error && places.length > 0 && (
            <List.Section>
              {places.map((place) => (
                <List.Item
                  key={place.id}
                  title={place.name}
                  description={place.description ?? t('common.notSpecified')}
                  onPress={() => router.push(`/places/${place.id}`)}
                />
              ))}
            </List.Section>
          )}
        </View>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/places/new')}
        />
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
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
