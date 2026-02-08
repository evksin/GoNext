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

type TripFormProps = {
  tripId?: number | null;
  onSaved: () => void;
};

export function TripForm({ tripId, onSaved }: TripFormProps) {
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
        setMessage('Поездка не найдена.');
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
      setMessage('Не удалось загрузить поездку.');
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage('Введите название поездки.');
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
      setMessage('Не удалось сохранить поездку.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        label="Название"
        value={title}
        onChangeText={setTitle}
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

      <TextInput
        label="Дата начала"
        value={startDate}
        onChangeText={setStartDate}
        mode="outlined"
        editable={Platform.OS === 'web'}
        placeholder="ГГГГ-ММ-ДД"
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
        label="Дата окончания"
        value={endDate}
        onChangeText={setEndDate}
        mode="outlined"
        editable={Platform.OS === 'web'}
        placeholder="ГГГГ-ММ-ДД"
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
        <Text>Текущая поездка</Text>
        <Switch value={current} onValueChange={setCurrent} />
      </View>

      <TextInput
        label="Теги"
        value={tagsInput}
        onChangeText={setTagsInput}
        mode="outlined"
        placeholder="тур, зима, семья"
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
      >
        Сохранить
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
