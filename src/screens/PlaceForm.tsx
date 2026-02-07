import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { getPlaceById, savePlace } from '../data/places';

type PlaceFormProps = {
  placeId?: number | null;
  onSaved: () => void;
};

export function PlaceForm({ placeId, onSaved }: PlaceFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visitLater, setVisitLater] = useState(true);
  const [liked, setLiked] = useState(false);
  const [coordinates, setCoordinates] = useState('');
  const [coordsDirty, setCoordsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setVisitLater(true);
    setLiked(false);
    setCoordinates('');
    setCoordsDirty(false);
  }, []);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      return;
    }
    try {
      const place = await getPlaceById(placeId);
      if (!place) {
        setMessage('Место не найдено.');
        return;
      }
      setName(place.name);
      setDescription(place.description ?? '');
      setVisitLater(place.visitLater);
      setLiked(place.liked);
      if (place.ddLat != null && place.ddLng != null) {
        setCoordinates(`${place.ddLat}, ${place.ddLng}`);
      } else {
        setCoordinates('');
      }
      setCoordsDirty(false);
    } catch {
      setMessage('Не удалось загрузить место.');
    }
  }, [placeId]);

  useEffect(() => {
    if (!placeId) {
      resetForm();
      return;
    }
    loadPlace();
  }, [loadPlace, placeId, resetForm]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage('Введите название места.');
      return;
    }

    const parsed = parseCoordinates(coordinates);
    if (!parsed && coordinates.trim()) {
      setMessage('Введите координаты в формате "широта, долгота".');
      return;
    }

    setLoading(true);
    try {
      await savePlace({
        id: placeId ?? undefined,
        name: trimmedName,
        description: description.trim() ? description.trim() : null,
        visitLater,
        liked,
        ddLat: parsed?.lat ?? null,
        ddLng: parsed?.lng ?? null,
        ddText: coordinates.trim() ? coordinates.trim() : null,
        photos: [],
      });
      onSaved();
    } catch {
      setMessage('Не удалось сохранить место.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        label="Название"
        value={name}
        onChangeText={setName}
        mode="outlined"
      />

      <TextInput
        label="Описание"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={styles.input}
      />

      <View style={styles.switchRow}>
        <Text>Хочу посетить</Text>
        <Switch value={visitLater} onValueChange={setVisitLater} />
      </View>

      <View style={styles.switchRow}>
        <Text>Понравилось</Text>
        <Switch value={liked} onValueChange={setLiked} />
      </View>

      <TextInput
        label="Координаты (DD)"
        value={coordinates}
        onChangeText={(value) => {
          setCoordinates(value);
          setCoordsDirty(true);
        }}
        onFocus={() => {
          if (!placeId && !coordsDirty) {
            setCoordinates('');
          }
        }}
        mode="outlined"
        placeholder="55.7558, 37.6176"
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
      >
        Сохранить
      </Button>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => setMessage('')}
        duration={2500}
      >
        {message}
      </Snackbar>
    </View>
  );
}

const parseCoordinates = (
  value: string
): { lat: number; lng: number } | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const matches = trimmed.match(/-?\d+(?:[.,]\d+)?/g);
  if (!matches || matches.length < 2) {
    return null;
  }
  const lat = Number(matches[0].replace(',', '.'));
  const lng = Number(matches[1].replace(',', '.'));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng };
};

const styles = StyleSheet.create({
  form: {
    padding: 16,
    gap: 12,
  },
  input: {
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    marginTop: 8,
  },
});
