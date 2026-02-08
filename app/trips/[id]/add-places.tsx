import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  Checkbox,
  List,
  Snackbar,
  Text,
} from 'react-native-paper';

import { listPlaces } from '../../../src/data/places';
import {
  addPlaceToTrip,
  getTripPlaceColumnNames,
  getTripPlaceCounts,
  listTripPlaces,
} from '../../../src/data/trips';
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
  const [infoText, setInfoText] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const buildMarker = 'build:2026-02-07-17';

  const loadData = useCallback(async () => {
    if (!tripId || Number.isNaN(tripId)) {
      const text = `${buildMarker} | tripId=invalid`;
      setMessage('Некорректный идентификатор поездки.');
      setStatusText(text);
      setInfoText(text);
      return;
    }
    const columns = await getTripPlaceColumnNames();
    const baseText = `${buildMarker} | tripId=${tripId} | columns=${columns.join(',') || 'none'}`;
    setStatusText(baseText);
    setInfoText(baseText);
    try {
      const [allPlaces, tripPlaces] = await Promise.all([
        listPlaces(),
        listTripPlaces(tripId),
      ]);
      const existing = new Set(tripPlaces.map((item) => item.placeId));
      setPlaces(allPlaces.filter((place) => !existing.has(place.id)));
      setSelectedIds(new Set());
    } catch {
      const text = `${buildMarker} | tripId=${tripId} | load error`;
      setMessage('Не удалось загрузить места.');
      setStatusText(text);
      setInfoText(text);
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
    if (selectedIds.size === 0) {
      setMessage('Выберите хотя бы одно место.');
      return;
    }
    try {
      const ids = Array.from(selectedIds);
      setMessage(`Нажато: ${new Date().toLocaleTimeString()}`);
      const selectingText = `tripId=${tripId}, выбранные=${ids.length}`;
      setStatusText(selectingText);
      setMessage(`Выбрано: ${ids.length}`);
      setInfoText(selectingText);
      const beforeCount = (await listTripPlaces(tripId)).length;
      const beforeText = `tripId=${tripId}, выбранные=${ids.length}, до=${beforeCount}`;
      setStatusText(beforeText);
      setMessage(`До добавления: ${beforeCount}`);
      setInfoText(beforeText);
      const insertedIds = await Promise.all(
        ids.map((id) => addPlaceToTrip(tripId, id))
      );
      const afterCount = (await listTripPlaces(tripId)).length;
      const counts = await getTripPlaceCounts(tripId);
      if (afterCount <= beforeCount) {
        const text = `Места не добавлены. tripId=${tripId}, выбранные=${ids.length}, до=${beforeCount}, после=${afterCount}, total=${counts.total}, forTrip=${counts.forTrip}`;
        setMessage(text);
        setInfoText(text);
        return;
      }
      const successText = `Успешно: tripId=${tripId}, ids=${insertedIds.join(',')}, total=${counts.total}, forTrip=${counts.forTrip}`;
      setStatusText(successText);
      setMessage(successText);
      setInfoText(successText);
      setAddedSuccess(true);
    } catch (error) {
      console.error('Add places failed:', error);
      const details = error instanceof Error ? error.message : 'unknown';
      const text = `Ошибка: tripId=${tripId}, ${details}`;
      setStatusText(text);
      setInfoText(text);
      setMessage('Не удалось добавить места.');
    }
  };

  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Добавить места" />
        <Appbar.Action icon="bug" onPress={() => setMessage('Нажата иконка в шапке')} />
      </Appbar.Header>

      <View style={styles.content}>
        <Text>{buildMarker}</Text>
        <Text>tripId: {rawId ?? 'нет'}</Text>
        <TouchableOpacity
          onPress={() => setMessage('Нажата тест-кнопка в контенте')}
          style={styles.testButton}
          activeOpacity={0.8}
        >
          <Text style={styles.testButtonText}>Тест касания (контент)</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.listContent}>
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
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <Text>Выбрано: {selectedIds.size}</Text>
        <Text>{statusText || 'status: ожидаю'}</Text>
        {infoText ? <Text>{infoText}</Text> : null}
        {addedSuccess && (
          <Button mode="outlined" onPress={() => router.replace(`/trips/${tripId}`)}>
            Готово
          </Button>
        )}
        <TouchableOpacity
          onPress={() => setMessage('Нажата тест-кнопка внизу')}
          style={styles.testButton}
          activeOpacity={0.8}
        >
          <Text style={styles.testButtonText}>Тест касания (низ)</Text>
        </TouchableOpacity>
        <Pressable
          style={[
            styles.addButton,
            selectedIds.size === 0 && styles.addButtonDisabled,
          ]}
          onPressIn={() => {
            const text = `Responder start (selected=${selectedIds.size})`;
            setMessage(text);
            setStatusText(text);
            setInfoText(`${text} | ${new Date().toLocaleTimeString()}`);
          }}
          onPress={() => {
            const text = `Press (selected=${selectedIds.size})`;
            setStatusText(text);
            setInfoText(`${text} | ${new Date().toLocaleTimeString()}`);
            handleAdd();
          }}
        >
          <Text style={styles.addButtonText}>
            Добавить выбранные ({selectedIds.size})
          </Text>
        </Pressable>
      </View>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => setMessage('')}
        duration={10000}
      >
        {message}
      </Snackbar>
    </View>
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
  actions: {
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  testButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  addButtonText: {
    color: '#ffffff',
  },
});
