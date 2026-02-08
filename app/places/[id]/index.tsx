import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { listPlaceTags } from '../../../src/data/tags';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AppHeader } from '../../../src/components/AppHeader';
import { Place } from '../../../src/models/types';

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const placeId = useMemo(
    () => (params.id ? Number(params.id) : null),
    [params.id]
  );

  const [place, setPlace] = useState<Place | null>(null);
  const [tags, setTags] = useState<string[]>([]);
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
      setTags(await listPlaceTags(data.id));
    } catch {
      setMessage('Не удалось загрузить место.');
    }
  }, [placeId]);

  useFocusEffect(
    useCallback(() => {
      loadPlace();
    }, [loadPlace])
  );

  const handleOpenMap = async () => {
    const coords = getPlaceCoordinates(place);
    if (!coords) {
      setMessage('Координаты не указаны.');
      return;
    }
    const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
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
        <AppHeader
          title="Место"
          rightActions={
            place ? (
              <Appbar.Action
                icon="pencil"
                onPress={() => router.push(`/places/${place.id}/edit`)}
              />
            ) : null
          }
        />

        <View style={styles.content}>
          {place ? (
            <Card>
              <Card.Title title={place.name} titleStyle={styles.titleText} />
              <Card.Content style={styles.cardContent}>
                <Text style={styles.bodyText}>
                  {place.description ?? 'Без описания'}
                </Text>
                <Text style={styles.bodyText}>
                  Хочу посетить: {place.visitLater ? 'да' : 'нет'}
                </Text>
                <Text style={styles.bodyText}>
                  Понравилось: {place.liked ? 'да' : 'нет'}
                </Text>
                <Text style={styles.bodyText}>
                  Координаты: {formatCoordinates(place)}
                </Text>
                <Text style={styles.bodyText}>
                  Теги: {formatTags(tags)}
                </Text>
                <Text style={styles.bodyText}>
                  Создано: {new Date(place.createdAt).toLocaleString()}
                </Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="contained"
                  onPress={handleOpenMap}
                  contentStyle={styles.actionButton}
                  labelStyle={styles.actionLabel}
                >
                  Открыть на карте
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmVisible(true)}
                  contentStyle={styles.actionButton}
                  labelStyle={styles.actionLabel}
                >
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

const getPlaceCoordinates = (
  place: Place | null
): { lat: number; lng: number } | null => {
  if (!place) {
    return null;
  }
  if (place.ddLat != null && place.ddLng != null) {
    return { lat: place.ddLat, lng: place.ddLng };
  }
  if (place.ddText) {
    const matches = place.ddText.match(/-?\d+(?:[.,]\d+)?/g);
    if (matches && matches.length >= 2) {
      const lat = Number(matches[0].replace(',', '.'));
      const lng = Number(matches[1].replace(',', '.'));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
};

const formatCoordinates = (place: Place | null): string => {
  const coords = getPlaceCoordinates(place);
  if (!coords) {
    return 'не указаны';
  }
  return `${coords.lat}, ${coords.lng}`;
};

const formatTags = (tags: string[]): string =>
  tags.length > 0 ? tags.join(', ') : 'нет';

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
  titleText: {
    fontSize: 20,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionButton: {
    paddingVertical: 6,
  },
  actionLabel: {
    fontSize: 16,
  },
});
