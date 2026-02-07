import { useCallback, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
import { savePhotoToAppStorage } from '../../../src/services/storage';

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
    photos: string[];
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
      photos: item.photos ?? [],
    });
  };

  const saveNotes = async () => {
    if (!noteDialog) {
      return;
    }
    await updateTripPlace(noteDialog.id, {
      notes: noteDialog.notes.trim() ? noteDialog.notes.trim() : null,
      photos: noteDialog.photos,
    });
    setNoteDialog(null);
    loadTrip();
  };

  const handleAddPhoto = async () => {
    if (!noteDialog) {
      return;
    }
    if (Platform.OS === 'web') {
      setMessage('Камера недоступна в веб-версии.');
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage('Нет доступа к камере.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    try {
      const savedPath = await savePhotoToAppStorage(result.assets[0].uri);
      setNoteDialog((prev) =>
        prev ? { ...prev, photos: [...prev.photos, savedPath] } : prev
      );
    } catch {
      setMessage('Не удалось сохранить фото.');
    }
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

        <ScrollView contentContainerStyle={styles.content}>
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
                    Дата визита: {formatDateTime(item.visitDate)}
                  </Text>
                  <Text>Заметки: {item.notes ?? 'нет'}</Text>
                  <Text>Фото:</Text>
                  {item.photos.length > 0 ? (
                    <View style={styles.photos}>
                      {item.photos.map((photo, photoIndex) => (
                        <Image
                          key={`${item.id}-photo-${photoIndex}`}
                          source={{ uri: photo }}
                          style={styles.photoThumb}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text>нет</Text>
                  )}
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
        </ScrollView>

        <Portal>
          <Dialog
            visible={Boolean(noteDialog)}
            onDismiss={() => setNoteDialog(null)}
          >
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
              <Button mode="outlined" onPress={handleAddPhoto}>
                Сделать фото
              </Button>
              {noteDialog && noteDialog.photos.length > 0 ? (
                <View style={styles.photos}>
                  {noteDialog.photos.map((photo, photoIndex) => (
                    <Image
                      key={`dialog-photo-${photoIndex}`}
                      source={{ uri: photo }}
                      style={styles.photoThumb}
                    />
                  ))}
                </View>
              ) : (
                <Text>Фото не добавлены.</Text>
              )}
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
    padding: 16,
    paddingBottom: 32,
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
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
});

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
