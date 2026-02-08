import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';
import { getPlaceById } from '../../src/data/places';
import { getCurrentTrip, getNextTripPlace } from '../../src/data/trips';
import { Place, Trip, TripPlace } from '../../src/models/types';

export default function NextPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [nextItem, setNextItem] = useState<TripPlace | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setMessage(null);
    try {
      const currentTrip = await getCurrentTrip();
      setTrip(currentTrip);
      if (!currentTrip) {
        setNextItem(null);
        setPlace(null);
        return;
      }
      const nextTripPlace = await getNextTripPlace(currentTrip.id);
      setNextItem(nextTripPlace);
      if (!nextTripPlace) {
        setPlace(null);
        return;
      }
      const placeData = await getPlaceById(nextTripPlace.placeId);
      setPlace(placeData);
    } catch {
      setMessage(t('nextPlace.loadFail'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadNext();
    }, [loadNext])
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

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('nextPlace.title')} />

        <View style={styles.content}>
          {message && <Text>{message}</Text>}
          {!message && !trip && (
            <Card>
              <Card.Title title={t('nextPlace.noCurrentTrip')} />
              <Card.Content>
                <Text>{t('nextPlace.markCurrentTrip')}</Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={() => router.push('/trips')}>
                  {t('trips.openTrip')}
                </Button>
              </Card.Actions>
            </Card>
          )}

          {!message && trip && !nextItem && (
            <Card>
              <Card.Title title={trip.title} />
              <Card.Content>
                <Text>{t('nextPlace.allVisited')}</Text>
              </Card.Content>
            </Card>
          )}

          {!message && trip && nextItem && place && (
            <Card>
              <Card.Title title={place.name} subtitle={trip.title} />
              <Card.Content style={styles.cardContent}>
                <Text>{place.description ?? t('common.notSpecified')}</Text>
                <Text>
                  {t('nextPlace.coordinates')}{' '}
                  {place.ddLat != null && place.ddLng != null
                    ? `${place.ddLat}, ${place.ddLng}`
                    : place.ddText ?? t('nextPlace.coordsNotSpecified')}
                </Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button mode="contained" onPress={handleOpenMap} style={styles.actionButton}>
                  {t('nextPlace.openMap')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => router.push(`/places/${place.id}`)}
                  style={styles.actionButton}
                >
                  {t('nextPlace.openPlace')}
                </Button>
              </Card.Actions>
            </Card>
          )}
        </View>
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
    gap: 12,
  },
  cardContent: {
    gap: 6,
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  actionButton: {
    alignSelf: 'stretch',
  },
});

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
