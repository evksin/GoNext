import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Button,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { getTripById, saveTrip } from '../data/trips';
import { listTripTags, parseTagInput, setTripTags } from '../data/tags';
import { useTranslation } from 'react-i18next';

type TripFormProps = {
  tripId?: number | null;
  onSaved: () => void;
};

export function TripForm({ tripId, onSaved }: TripFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [picker, setPicker] = useState<{
    type: 'start' | 'end';
    visible: boolean;
  }>({ type: 'start', visible: false });

  const startDateValue = useMemo(
    () => parseDateInput(startDate),
    [startDate]
  );
  const endDateValue = useMemo(() => parseDateInput(endDate), [endDate]);

  const loadTrip = useCallback(async () => {
    if (!tripId) {
      return;
    }
    try {
      const trip = await getTripById(tripId);
      if (!trip) {
        setMessage(t('trips.notFound'));
        return;
      }
      setTitle(trip.title);
      setDescription(trip.description ?? '');
      setStartDate(trip.startDate ?? '');
      setEndDate(trip.endDate ?? '');
      setCurrent(trip.current);
      const tags = await listTripTags(trip.id);
      setTagsInput(tags.join(', '));
    } catch {
      setMessage(t('trips.loadFail'));
    }
  }, [tripId, t]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage(t('trips.titleRequired'));
      return;
    }

    setLoading(true);
    try {
      const savedId = await saveTrip({
        id: tripId ?? undefined,
        title: trimmedTitle,
        description: description.trim() ? description.trim() : null,
        startDate: startDate.trim() ? startDate.trim() : null,
        endDate: endDate.trim() ? endDate.trim() : null,
        current,
      });
      await setTripTags(savedId, parseTagInput(tagsInput));
      onSaved();
    } catch {
      setMessage(t('trips.saveFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        label={t('trips.titleLabel')}
        value={title}
        onChangeText={setTitle}
        mode="outlined"
      />

      <TextInput
        label={t('trips.descriptionLabel')}
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={styles.input}
      />

      <TextInput
        label={t('trips.startDate')}
        value={startDate}
        onChangeText={setStartDate}
        mode="outlined"
        editable={Platform.OS === 'web'}
        placeholder={t('common.dateFormat')}
        right={
          Platform.OS === 'web'
            ? undefined
            : (
                <TextInput.Icon
                  icon="calendar"
                  onPress={() => setPicker({ type: 'start', visible: true })}
                />
              )
        }
      />

      <TextInput
        label={t('trips.endDate')}
        value={endDate}
        onChangeText={setEndDate}
        mode="outlined"
        editable={Platform.OS === 'web'}
        placeholder={t('common.dateFormat')}
        right={
          Platform.OS === 'web'
            ? undefined
            : (
                <TextInput.Icon
                  icon="calendar"
                  onPress={() => setPicker({ type: 'end', visible: true })}
                />
              )
        }
      />

      <View style={styles.switchRow}>
        <Text>{t('trips.currentTrip')}</Text>
        <Switch value={current} onValueChange={setCurrent} />
      </View>

      <TextInput
        label={t('trips.tags')}
        value={tagsInput}
        onChangeText={setTagsInput}
        mode="outlined"
        placeholder={t('trips.tagsPlaceholder')}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
      >
        {t('common.save')}
      </Button>

      {picker.visible && Platform.OS !== 'web' && (
        <DateTimePicker
          value={
            picker.type === 'start'
              ? startDateValue ?? new Date()
              : endDateValue ?? new Date()
          }
          mode="date"
          display="calendar"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (event.type === 'dismissed') {
              setPicker((prev) => ({ ...prev, visible: false }));
              return;
            }
            if (date) {
              const formatted = formatDate(date);
              if (picker.type === 'start') {
                setStartDate(formatted);
              } else {
                setEndDate(formatted);
              }
            }
            if (Platform.OS === 'android') {
              setPicker((prev) => ({ ...prev, visible: false }));
            }
          }}
        />
      )}

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

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split('-').map((item) => Number(item));
  if (parts.length !== 3 || parts.some((item) => Number.isNaN(item))) {
    return null;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};
