import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  IconButton,
  List,
  Portal,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { getPlaceById } from '../../../src/data/places';
import {
  getTripById,
  listTripPlaces,
  removeTripPlace,
  updateTripPlace,
} from '../../../src/data/trips';
import { Place, Trip, TripPlace } from '../../../src/models/types';

type TripPlaceView = TripPlace & {
  place?: Place | null;
};

export default function TripDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = useMemo(
    () => (params.id ? Number(params.id) : null),
    [params.id]
  );

  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<TripPlaceView[]>([]);
  const [message, setMessage] = useState('');
  const [noteDialog, setNoteDialog] = useState<{
    id: number;
    notes: string;
    photos: string;
  } | null>(null);

  const loadTrip = useCallback(async () => {
    if (!tripId || Number.isNaN(tripId)) {
      setMessage('Некорректный идентификатор поездки.');
      return;
    }
    try {
      const data = await getTripById(tripId);
      if (!data) {
        setMessage('Поездка не найдена.');
        return;
      }
      setTrip(data);

      const tripPlaces = await listTripPlaces(tripId);
      const withPlaces = await Promise.all(
        tripPlaces.map(async (item) => ({
          ...item,
          place: await getPlaceById(item.placeId),
        }))
      );
      setItems(withPlaces);
    } catch {
      setMessage('Не удалось загрузить поездку.');
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip])
  );

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }
    const current = items[index];
    const target = items[targetIndex];
    await updateTripPlace(current.id, { orderIndex: target.orderIndex });
    await updateTripPlace(target.id, { orderIndex: current.orderIndex });
    loadTrip();
  };

  const toggleVisited = async (item: TripPlaceView, value: boolean) => {
    const visitDate = value ? new Date().toISOString() : null;
    await updateTripPlace(item.id, { visited: value, visitDate });
    loadTrip();
  };

  const openNotes = (item: TripPlaceView) => {
    setNoteDialog({
      id: item.id,
      notes: item.notes ?? '',
      photos: (item.photos ?? []).join(', '),
    });
  };

  const saveNotes = async () => {
    if (!noteDialog) {
      return;
    }
    const photos = noteDialog.photos
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    await updateTripPlace(noteDialog.id, {
      notes: noteDialog.notes.trim() ? noteDialog.notes.trim() : null,
      photos,
    });
    setNoteDialog(null);
    loadTrip();
  };

  const handleRemove = async (id: number) => {
    await removeTripPlace(id);
    loadTrip();
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Поездка" />
          {trip && (
            <Appbar.Action
              icon="pencil"
              onPress={() => router.push(`/trips/${trip.id}/edit`)}
            />
          )}
        </Appbar.Header>

        <View style={styles.content}>
          {trip && (
            <Card style={styles.tripCard}>
              <Card.Title title={trip.title} />
              <Card.Content style={styles.cardContent}>
                <Text>{trip.description ?? 'Без описания'}</Text>
                <Text>Начало: {trip.startDate ?? 'не указано'}</Text>
                <Text>Окончание: {trip.endDate ?? 'не указано'}</Text>
                <Text>Текущая: {trip.current ? 'да' : 'нет'}</Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => router.push(`/trips/${trip.id}/add-places`)}
                >
                  Добавить места
                </Button>
              </Card.Actions>
            </Card>
          )}

          <List.Section>
            <List.Subheader>Маршрут</List.Subheader>
            {items.length === 0 && <Text>Места не добавлены.</Text>}
            {items.map((item, index) => (
              <Card key={item.id} style={styles.placeCard}>
                <Card.Title
                  title={item.place?.name ?? 'Неизвестное место'}
                  subtitle={
                    item.place?.description ?? 'Без описания'
                  }
                  right={() => (
                    <View style={styles.cardRight}>
                      <IconButton
                        icon="chevron-up"
                        onPress={() => moveItem(index, -1)}
                        disabled={index === 0}
                      />
                      <IconButton
                        icon="chevron-down"
                        onPress={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                      />
                    </View>
                  )}
                />
                <Card.Content style={styles.cardContent}>
                  <View style={styles.switchRow}>
                    <Text>Посещено</Text>
                    <Switch
                      value={item.visited}
                      onValueChange={(value) => toggleVisited(item, value)}
                    />
                  </View>
                  <Text>
                    Дата визита: {item.visitDate ?? '—'}
                  </Text>
                  <Text>Заметки: {item.notes ?? 'нет'}</Text>
                  <Text>
                    Фото: {item.photos.length > 0 ? item.photos.length : 'нет'}
                  </Text>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                  <Button mode="outlined" onPress={() => openNotes(item)}>
                    Заметки/Фото
                  </Button>
                  <Button mode="outlined" onPress={() => handleRemove(item.id)}>
                    Удалить
                  </Button>
                </Card.Actions>
              </Card>
            ))}
          </List.Section>
        </View>

        <Portal>
          <Dialog visible={Boolean(noteDialog)} onDismiss={() => setNoteDialog(null)}>
            <Dialog.Title>Заметки и фото</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Заметки"
                value={noteDialog?.notes ?? ''}
                onChangeText={(value) =>
                  setNoteDialog((prev) => (prev ? { ...prev, notes: value } : prev))
                }
                mode="outlined"
                multiline
                style={styles.dialogInput}
              />
              <TextInput
                label="Фото (URL через запятую)"
                value={noteDialog?.photos ?? ''}
                onChangeText={(value) =>
                  setNoteDialog((prev) => (prev ? { ...prev, photos: value } : prev))
                }
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setNoteDialog(null)}>Отмена</Button>
              <Button onPress={saveNotes}>Сохранить</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

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
  tripCard: {
    marginBottom: 16,
  },
  placeCard: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 6,
  },
  cardActions: {
    flexWrap: 'wrap',
    gap: 8,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogInput: {
    marginBottom: 12,
  },
});
