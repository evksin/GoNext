import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  Checkbox,
  List,
  Snackbar,
  Text,
} from 'react-native-paper';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { listPlaces } from '../../../src/data/places';
import { addPlaceToTrip, listTripPlaces } from '../../../src/data/trips';
import { Place } from '../../../src/models/types';

export default function TripAddPlacesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const tripId = rawId ? Number(rawId) : null;

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');
  const buildMarker = 'build:2026-02-07-2';

  const loadData = useCallback(async () => {
    if (!tripId || Number.isNaN(tripId)) {
      setMessage('Некорректный идентификатор поездки.');
      setStatusText(`${buildMarker} | tripId=invalid`);
      return;
    }
    setStatusText(`${buildMarker} | tripId=${tripId}`);
    try {
      const [allPlaces, tripPlaces] = await Promise.all([
        listPlaces(),
        listTripPlaces(tripId),
      ]);
      const existing = new Set(tripPlaces.map((item) => item.placeId));
      setPlaces(allPlaces.filter((place) => !existing.has(place.id)));
      setSelectedIds(new Set());
    } catch {
      setMessage('Не удалось загрузить места.');
      setStatusText(`${buildMarker} | tripId=${tripId} | load error`);
    }
  }, [tripId]);

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
      setMessage('Некорректный идентификатор поездки.');
      return;
    }
    try {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) {
        setMessage('Выберите хотя бы одно место.');
        return;
      }
      setStatusText(`tripId=${tripId}, выбранные=${ids.length}`);
      const beforeCount = (await listTripPlaces(tripId)).length;
      setStatusText(
        `tripId=${tripId}, выбранные=${ids.length}, до=${beforeCount}`
      );
      await Promise.all(ids.map((id) => addPlaceToTrip(tripId, id)));
      const afterCount = (await listTripPlaces(tripId)).length;
      if (afterCount <= beforeCount) {
        setMessage(
          `Места не добавлены. tripId=${tripId}, выбранные=${ids.length}, до=${beforeCount}, после=${afterCount}`
        );
        return;
      }
      setStatusText(
        `Успешно: tripId=${tripId}, до=${beforeCount}, после=${afterCount}`
      );
      router.replace(`/trips/${tripId}`);
    } catch (error) {
      console.error('Add places failed:', error);
      const details = error instanceof Error ? error.message : 'unknown';
      setStatusText(`Ошибка: tripId=${tripId}, ${details}`);
      setMessage('Не удалось добавить места.');
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Добавить места" />
        </Appbar.Header>

        <View style={styles.content}>
          <Text>{buildMarker}</Text>
          <Text>tripId: {rawId ?? 'нет'}</Text>
          {places.length === 0 && <Text>Нет доступных мест.</Text>}
          {places.length > 0 && (
            <List.Section>
              {places.map((place) => {
                const checked = isSelected(place.id);
                return (
                  <List.Item
                    key={place.id}
                    title={place.name}
                    description={place.description ?? 'Без описания'}
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
        </View>

        <View style={styles.actions}>
          <Text>Выбрано: {selectedIds.size}</Text>
          {statusText ? <Text>{statusText}</Text> : null}
          <Button
            mode="contained"
            onPress={handleAdd}
            disabled={selectedIds.size === 0}
          >
            Добавить выбранные
          </Button>
        </View>

        <Snackbar
          visible={Boolean(message)}
          onDismiss={() => setMessage('')}
          duration={2500}
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  actions: {
    padding: 16,
  },
});
