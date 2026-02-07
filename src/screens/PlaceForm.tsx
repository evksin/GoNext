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
  const [ddLat, setDdLat] = useState('');
  const [ddLng, setDdLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      setDdLat(place.ddLat?.toString() ?? '');
      setDdLng(place.ddLng?.toString() ?? '');
    } catch {
      setMessage('Не удалось загрузить место.');
    }
  }, [placeId]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage('Введите название места.');
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
        ddLat: ddLat.trim() ? Number(ddLat) : null,
        ddLng: ddLng.trim() ? Number(ddLng) : null,
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
        label="Широта (DD)"
        value={ddLat}
        onChangeText={setDdLat}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Долгота (DD)"
        value={ddLng}
        onChangeText={setDdLng}
        mode="outlined"
        keyboardType="numeric"
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
