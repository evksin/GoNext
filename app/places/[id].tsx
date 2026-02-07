import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { getPlaceById, savePlace } from '../../src/data/places';

export default function PlaceEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isNew = params.id === 'new' || !params.id;
  const placeId = useMemo(
    () => (isNew ? null : Number(params.id)),
    [isNew, params.id]
  );

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
      router.back();
    } catch {
      setMessage('Не удалось сохранить место.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={isNew ? 'Новое место' : 'Редактирование места'}
        />
      </Appbar.Header>

      <View style={styles.content}>
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
      </View>

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
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
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
