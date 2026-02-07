import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from 'react-native-paper';

import { deletePlace, getPlaceById } from '../../../src/data/places';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Place } from '../../../src/models/types';

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const placeId = useMemo(
    () => (params.id ? Number(params.id) : null),
    [params.id]
  );

  const [place, setPlace] = useState<Place | null>(null);
  const [message, setMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);

  const loadPlace = useCallback(async () => {
    if (!placeId || Number.isNaN(placeId)) {
      setMessage('Некорректный идентификатор места.');
      return;
    }
    try {
      const data = await getPlaceById(placeId);
      if (!data) {
        setMessage('Место не найдено.');
        return;
      }
      setPlace(data);
    } catch {
      setMessage('Не удалось загрузить место.');
    }
  }, [placeId]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  const handleOpenMap = async () => {
    if (!place || place.ddLat == null || place.ddLng == null) {
      setMessage('Координаты не указаны.');
      return;
    }
    const url = `https://www.google.com/maps?q=${place.ddLat},${place.ddLng}`;
    try {
      await Linking.openURL(url);
    } catch {
      setMessage('Не удалось открыть карту.');
    }
  };

  const handleDelete = async () => {
    if (!place) {
      return;
    }
    try {
      await deletePlace(place.id);
      router.back();
    } catch {
      setMessage('Не удалось удалить место.');
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Место" />
          {place && (
            <Appbar.Action
              icon="pencil"
              onPress={() => router.push(`/places/${place.id}/edit`)}
            />
          )}
        </Appbar.Header>

        <View style={styles.content}>
          {place ? (
            <Card>
              <Card.Title title={place.name} />
              <Card.Content style={styles.cardContent}>
                <Text>{place.description ?? 'Без описания'}</Text>
                <Text>
                  Хочу посетить: {place.visitLater ? 'да' : 'нет'}
                </Text>
                <Text>Понравилось: {place.liked ? 'да' : 'нет'}</Text>
                <Text>
                  Координаты:{' '}
                  {place.ddLat != null && place.ddLng != null
                    ? `${place.ddLat}, ${place.ddLng}`
                    : 'не указаны'}
                </Text>
                <Text>Создано: {new Date(place.createdAt).toLocaleString()}</Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button mode="contained" onPress={handleOpenMap}>
                  Открыть на карте
                </Button>
                <Button mode="outlined" onPress={() => setConfirmVisible(true)}>
                  Удалить
                </Button>
              </Card.Actions>
            </Card>
          ) : (
            <Text>Загрузка...</Text>
          )}
        </View>

        <Snackbar
          visible={Boolean(message)}
          onDismiss={() => setMessage('')}
          duration={2500}
        >
          {message}
        </Snackbar>

        <Portal>
          <Dialog
            visible={confirmVisible}
            onDismiss={() => setConfirmVisible(false)}
          >
            <Dialog.Title>Удалить место?</Dialog.Title>
            <Dialog.Content>
              <Text>
                Это действие нельзя отменить.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmVisible(false)}>Отмена</Button>
              <Button
                onPress={async () => {
                  setConfirmVisible(false);
                  await handleDelete();
                }}
              >
                Удалить
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  cardContent: {
    gap: 6,
  },
  cardActions: {
    flexWrap: 'wrap',
    gap: 8,
  },
});
