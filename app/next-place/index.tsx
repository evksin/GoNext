import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Appbar, Button, Card, Text } from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { getPlaceById } from '../../src/data/places';
import { getCurrentTrip, getNextTripPlace } from '../../src/data/trips';
import { Place, Trip, TripPlace } from '../../src/models/types';

export default function NextPlaceScreen() {
  const router = useRouter();
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
      setMessage('Не удалось загрузить следующее место.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNext();
    }, [loadNext])
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

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Следующее место" />
        </Appbar.Header>

        <View style={styles.content}>
          {message && <Text>{message}</Text>}
          {!message && !trip && (
            <Card>
              <Card.Title title="Нет текущей поездки" />
              <Card.Content>
                <Text>Отметьте поездку как текущую.</Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={() => router.push('/trips')}>
                  К поездкам
                </Button>
              </Card.Actions>
            </Card>
          )}

          {!message && trip && !nextItem && (
            <Card>
              <Card.Title title={trip.title} />
              <Card.Content>
                <Text>Все места посещены.</Text>
              </Card.Content>
            </Card>
          )}

          {!message && trip && nextItem && place && (
            <Card>
              <Card.Title title={place.name} subtitle={trip.title} />
              <Card.Content style={styles.cardContent}>
                <Text>{place.description ?? 'Без описания'}</Text>
                <Text>
                  Координаты:{' '}
                  {place.ddLat != null && place.ddLng != null
                    ? `${place.ddLat}, ${place.ddLng}`
                    : place.ddText ?? 'не указаны'}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={handleOpenMap}>
                  Открыть на карте
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => router.push(`/places/${place.id}`)}
                >
                  Открыть место
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
