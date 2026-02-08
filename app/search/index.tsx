import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  List,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { searchPlaces, searchTripNotes, searchTrips } from '../../src/data/search';
import { parseTagInput } from '../../src/data/tags';
import { Place, Trip } from '../../src/models/types';
import { NoteSearchResult } from '../../src/data/search';

type SearchType = 'places' | 'trips' | 'notes';

export default function SearchScreen() {
  const router = useRouter();
  const [type, setType] = useState<SearchType>('places');
  const [query, setQuery] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [notes, setNotes] = useState<NoteSearchResult[]>([]);

  const handleSearch = async () => {
    const trimmedYear = yearInput.trim();
    const year = trimmedYear ? Number(trimmedYear) : undefined;
    if (trimmedYear && Number.isNaN(year)) {
      setMessage('Год должен быть числом.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const tags = parseTagInput(tagsInput);
      if (type === 'places') {
        const data = await searchPlaces({ text: query.trim(), tags, year });
        setPlaces(data);
        setTrips([]);
        setNotes([]);
      } else if (type === 'trips') {
        const data = await searchTrips({ text: query.trim(), tags, year });
        setTrips(data);
        setPlaces([]);
        setNotes([]);
      } else {
        const data = await searchTripNotes({ text: query.trim(), tags, year });
        setNotes(data);
        setPlaces([]);
        setTrips([]);
      }
    } catch {
      setMessage('Не удалось выполнить поиск.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title="Поиск" />

        <View style={styles.content}>
          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as SearchType)}
            buttons={[
              { value: 'places', label: 'Места' },
              { value: 'trips', label: 'Поездки' },
              { value: 'notes', label: 'Заметки' },
            ]}
          />

          <TextInput
            label="Поиск по тексту"
            value={query}
            onChangeText={setQuery}
            mode="outlined"
          />

          <TextInput
            label="Теги"
            value={tagsInput}
            onChangeText={setTagsInput}
            mode="outlined"
            placeholder="музей, прогулка"
          />

          <TextInput
            label="Год"
            value={yearInput}
            onChangeText={setYearInput}
            mode="outlined"
            keyboardType="number-pad"
            placeholder="2026"
          />

          <Button mode="contained" onPress={handleSearch} loading={loading}>
            Найти
          </Button>

          {loading && <ActivityIndicator style={styles.loading} />}

          <ScrollView contentContainerStyle={styles.results}>
            {type === 'places' &&
              places.map((place) => (
                <List.Item
                  key={place.id}
                  title={place.name}
                  description={place.description ?? 'Без описания'}
                  onPress={() => router.push(`/places/${place.id}`)}
                />
              ))}

            {type === 'trips' &&
              trips.map((trip) => (
                <List.Item
                  key={trip.id}
                  title={trip.title}
                  description={trip.description ?? 'Без описания'}
                  onPress={() => router.push(`/trips/${trip.id}`)}
                />
              ))}

            {type === 'notes' &&
              notes.map((note) => (
                <List.Item
                  key={note.tripPlaceId}
                  title={note.placeName}
                  description={`${note.tripTitle}${note.notes ? ` • ${note.notes}` : ''}`}
                  onPress={() => router.push(`/trips/${note.tripId}`)}
                />
              ))}

            {!loading &&
              query.trim() === '' &&
              tagsInput.trim() === '' &&
              yearInput.trim() === '' && <Text>Введите критерии поиска.</Text>}

            {!loading &&
              type === 'places' &&
              places.length === 0 &&
              (query.trim() || tagsInput.trim() || yearInput.trim()) && (
                <Text>Ничего не найдено.</Text>
              )}
            {!loading &&
              type === 'trips' &&
              trips.length === 0 &&
              (query.trim() || tagsInput.trim() || yearInput.trim()) && (
                <Text>Ничего не найдено.</Text>
              )}
            {!loading &&
              type === 'notes' &&
              notes.length === 0 &&
              (query.trim() || tagsInput.trim() || yearInput.trim()) && (
                <Text>Ничего не найдено.</Text>
              )}
          </ScrollView>
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
    gap: 12,
  },
  loading: {
    marginTop: 8,
  },
  results: {
    paddingBottom: 32,
    gap: 4,
  },
});
