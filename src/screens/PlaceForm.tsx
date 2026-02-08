import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { getPlaceById, savePlace } from '../data/places';
import { listPlaceTags, parseTagInput, setPlaceTags } from '../data/tags';

type PlaceFormProps = {
  placeId?: number | null;
  onSaved: () => void;
};

export function PlaceForm({ placeId, onSaved }: PlaceFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visitLater, setVisitLater] = useState(true);
  const [liked, setLiked] = useState(false);
  const [coordinates, setCoordinates] = useState('');
  const [coordsDirty, setCoordsDirty] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setVisitLater(true);
    setLiked(false);
    setCoordinates('');
    setCoordsDirty(false);
    setTagsInput('');
  }, []);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      return;
    }
    try {
      const place = await getPlaceById(placeId);
      if (!place) {
        setMessage(t('places.notFound'));
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
      const tags = await listPlaceTags(place.id);
      setTagsInput(tags.join(', '));
    } catch {
      setMessage(t('places.loadFail'));
    }
  }, [placeId, t]);

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
      setMessage(t('places.nameRequired'));
      return;
    }

    const parsed = parseCoordinates(coordinates);
    if (!parsed && coordinates.trim()) {
      setMessage(t('places.coordinatesHint'));
      return;
    }

    setLoading(true);
    try {
      const savedId = await savePlace({
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
      await setPlaceTags(savedId, parseTagInput(tagsInput));
      onSaved();
    } catch {
      setMessage(t('places.saveFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        label={t('places.name')}
        value={name}
        onChangeText={setName}
        mode="outlined"
      />

      <TextInput
        label={t('places.description')}
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={styles.input}
      />

      <View style={styles.switchRow}>
        <Text>{t('places.visitLater')}</Text>
        <Switch value={visitLater} onValueChange={setVisitLater} />
      </View>

      <View style={styles.switchRow}>
        <Text>{t('places.liked')}</Text>
        <Switch value={liked} onValueChange={setLiked} />
      </View>

      <TextInput
        label={t('places.coordinates')}
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
        placeholder={t('places.coordinatesPlaceholder')}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        textContentType="none"
        importantForAutofill="noExcludeDescendants"
        right={
          coordinates
            ? (
                <TextInput.Icon
                  icon="close-circle"
                  onPress={() => {
                    setCoordinates('');
                    setCoordsDirty(false);
                  }}
                />
              )
            : undefined
        }
      />

      <TextInput
        label={t('places.tags')}
        value={tagsInput}
        onChangeText={setTagsInput}
        mode="outlined"
        placeholder={t('places.tagsPlaceholder')}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
      >
        {t('common.save')}
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
