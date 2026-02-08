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

import { listPlaces } from '../../src/data/places';
import { Place } from '../../src/models/types';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';

export default function PlacesListScreen() {
  const router = useRouter();
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
      setError('Не удалось загрузить список мест.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces])
  );

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader
          title="Места"
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
            <Text>Пока нет сохранённых мест.</Text>
          )}

          {!loading && !error && places.length > 0 && (
            <List.Section>
              {places.map((place) => (
                <List.Item
                  key={place.id}
                  title={place.name}
                  description={place.description ?? 'Без описания'}
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
