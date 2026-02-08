import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { deletePlace, getPlaceById } from '../../../src/data/places';
import { listPlaceTags } from '../../../src/data/tags';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AppHeader } from '../../../src/components/AppHeader';
import { Place } from '../../../src/models/types';

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      setMessage(t('places.invalidId'));
      return;
    }
    try {
      const data = await getPlaceById(placeId);
      if (!data) {
        setMessage(t('places.notFound'));
        return;
      }
      setPlace(data);
      setTags(await listPlaceTags(data.id));
    } catch {
      setMessage(t('places.loadFail'));
    }
  }, [placeId, t]);

  useFocusEffect(
    useCallback(() => {
      loadPlace();
    }, [loadPlace])
  );

  const handleOpenMap = async () => {
    const coords = getPlaceCoordinates(place);
    if (!coords) {
      setMessage(t('nextPlace.coordsMissing'));
      return;
    }
    const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    try {
      await Linking.openURL(url);
    } catch {
      setMessage(t('nextPlace.mapFail'));
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
      setMessage(t('places.deleteFail'));
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader
          title={t('places.title')}
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
                  {place.description ?? t('common.notSpecified')}
                </Text>
                <Text style={styles.bodyText}>
                  {t('places.visitLater')}: {place.visitLater ? t('common.yes') : t('common.no')}
                </Text>
                <Text style={styles.bodyText}>
                  {t('places.liked')}: {place.liked ? t('common.yes') : t('common.no')}
                </Text>
                <Text style={styles.bodyText}>
                  {t('nextPlace.coordinates')}: {formatCoordinates(place, t)}
                </Text>
                <Text style={styles.bodyText}>{t('places.tags')}:</Text>
                <View style={styles.tagRow}>
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Chip key={tag} style={styles.tagChip}>
                        {tag}
                      </Chip>
                    ))
                  ) : (
                    <Text style={styles.bodyText}>{t('places.tagsNone')}</Text>
                  )}
                </View>
                <Text style={styles.bodyText}>
                  {t('places.createdAt')}: {new Date(place.createdAt).toLocaleString()}
                </Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="contained"
                  onPress={handleOpenMap}
                  contentStyle={styles.actionButton}
                  labelStyle={styles.actionLabel}
                >
                  {t('places.openMap')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmVisible(true)}
                  contentStyle={styles.actionButton}
                  labelStyle={styles.actionLabel}
                >
                  {t('places.delete')}
                </Button>
              </Card.Actions>
            </Card>
          ) : (
            <Text>{t('common.loading')}</Text>
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
          <Dialog.Title>{t('places.deleteConfirmTitle')}</Dialog.Title>
            <Dialog.Content>
            <Text>{t('places.deleteConfirmText')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>{t('common.cancel')}</Button>
              <Button
                onPress={async () => {
                  setConfirmVisible(false);
                  await handleDelete();
                }}
              >
              {t('common.delete')}
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

const formatCoordinates = (place: Place | null, t: (key: string) => string): string => {
  const coords = getPlaceCoordinates(place);
  if (!coords) {
    return t('nextPlace.coordsNotSpecified');
  }
  return `${coords.lat}, ${coords.lng}`;
};

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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tagChip: {
    height: 28,
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
