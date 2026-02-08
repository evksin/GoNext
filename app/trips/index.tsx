import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Appbar, FAB, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';
import { listTrips } from '../../src/data/trips';
import { Trip } from '../../src/models/types';

export default function TripsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setError(null);
    try {
      const data = await listTrips();
      setTrips(data);
    } catch {
      setError(t('trips.loadError'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader
          title={t('trips.title')}
          rightActions={
            <Appbar.Action icon="plus" onPress={() => router.push('/trips/new')} />
          }
        />

        <View style={styles.content}>
          {error && <Text>{error}</Text>}
          {!error && trips.length === 0 && <Text>{t('trips.listEmpty')}</Text>}
          {!error && trips.length > 0 && (
            <List.Section>
              {trips.map((trip) => (
                <List.Item
                  key={trip.id}
                  title={trip.title}
                  description={
                    trip.description ?? (trip.current ? t('trips.currentTrip') : '')
                  }
                  onPress={() => router.push(`/trips/${trip.id}`)}
                />
              ))}
            </List.Section>
          )}
        </View>

        <FAB icon="plus" style={styles.fab} onPress={() => router.push('/trips/new')} />
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    width: '100%',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
