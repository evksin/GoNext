import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Checkbox,
  List,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AppHeader } from '../../../src/components/AppHeader';
import { listPlaces } from '../../../src/data/places';
import {
  addPlaceToTrip,
  listTripPlaces,
} from '../../../src/data/trips';
import { Place } from '../../../src/models/types';

export default function TripAddPlacesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const tripId = rawId ? Number(rawId) : null;

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!tripId || Number.isNaN(tripId)) {
      setMessage(t('trips.invalidId'));
      return;
    }
    try {
      const [allPlaces, tripPlaces] = await Promise.all([
        listPlaces(),
        listTripPlaces(tripId),
      ]);
      const existing = new Set(tripPlaces.map((item) => item.placeId));
      setPlaces(allPlaces.filter((place) => !existing.has(place.id)));
      setSelectedIds(new Set());
    } catch {
      setMessage(t('places.loadError'));
    }
  }, [tripId, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const togglePlace = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isSelected = (id: number) => selectedIds.has(id);

  const handleAdd = async () => {
    if (!tripId || Number.isNaN(tripId)) {
      setMessage(t('trips.invalidId'));
      return;
    }
    if (selectedIds.size === 0) {
      setMessage(t('trips.selectAtLeastOne'));
      return;
    }
    try {
      const ids = Array.from(selectedIds);
      const beforeCount = (await listTripPlaces(tripId)).length;
      const insertedIds = await Promise.all(
        ids.map((id) => addPlaceToTrip(tripId, id))
      );
      const afterCount = (await listTripPlaces(tripId)).length;
      if (afterCount <= beforeCount) {
        setMessage(t('trips.placesNotAdded'));
        return;
      }
      setMessage(t('trips.addSuccess', { count: insertedIds.length }));
      setAddedSuccess(true);
      loadData();
    } catch (error) {
      console.error('Add places failed:', error);
      setMessage(t('trips.addFail'));
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('trips.addPlacesTitle')} />

        <View style={styles.content}>
          <View style={styles.actionBar}>
            <Text>
              {t('common.selected')}: {selectedIds.size}
            </Text>
            <Button
              mode="contained"
              onPress={handleAdd}
              disabled={selectedIds.size === 0}
            >
              {t('trips.addPlaces')}
            </Button>
            {addedSuccess && (
              <Button
                mode="outlined"
                onPress={() => router.replace(`/trips/${tripId}`)}
              >
                {t('common.done')}
              </Button>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.listContent}>
            {places.length === 0 && <Text>{t('places.listEmpty')}</Text>}
            {places.length > 0 && (
              <List.Section>
                {places.map((place) => {
                  const checked = isSelected(place.id);
                  return (
                    <List.Item
                      key={place.id}
                      title={place.name}
                      description={place.description ?? t('common.notSpecified')}
                      onPress={() => togglePlace(place.id)}
                      left={() => (
                        <Checkbox
                          status={isSelected(place.id) ? 'checked' : 'unchecked'}
                          onPress={() => togglePlace(place.id)}
                        />
                      )}
                    />
                  );
                })}
              </List.Section>
            )}
          </ScrollView>
        </View>

        <Snackbar
          visible={Boolean(message)}
          onDismiss={() => setMessage('')}
          duration={4000}
        >
          {message}
        </Snackbar>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  actionBar: {
    gap: 8,
    marginBottom: 12,
  },
});
