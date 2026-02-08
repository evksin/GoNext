import { useCallback, useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  List,
  Portal,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AppHeader } from '../../../src/components/AppHeader';
import { getPlaceById } from '../../../src/data/places';
import {
  listTripPlaceTags,
  listTripTags,
  parseTagInput,
  setTripPlaceTags,
} from '../../../src/data/tags';
import {
  deleteTrip,
  getTripById,
  listTripPlaces,
  removeTripPlace,
  updateTripPlace,
} from '../../../src/data/trips';
import { Place, Trip, TripPlace } from '../../../src/models/types';
import { savePhotoToAppStorage } from '../../../src/services/storage';

type TripPlaceView = TripPlace & {
  place?: Place | null;
};

export default function TripDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = useMemo(
    () => (params.id ? Number(params.id) : null),
    [params.id]
  );

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripTags, setTripTags] = useState<string[]>([]);
  const [items, setItems] = useState<TripPlaceView[]>([]);
  const [message, setMessage] = useState('');
  const [noteDialog, setNoteDialog] = useState<{
    id: number;
    notes: string;
    photos: string[];
    tagsInput: string;
  } | null>(null);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const loadTrip = useCallback(async () => {
    if (!tripId || Number.isNaN(tripId)) {
      setMessage(t('trips.invalidId'));
      return;
    }
    try {
      const data = await getTripById(tripId);
      if (!data) {
        setMessage(t('trips.notFound'));
        return;
      }
      setTrip(data);
      setTripTags(await listTripTags(data.id));

      const tripPlaces = await listTripPlaces(tripId);
      const withPlaces = await Promise.all(
        tripPlaces.map(async (item) => ({
          ...item,
          place: await getPlaceById(item.placeId),
        }))
      );
      setItems(withPlaces);
    } catch {
      setMessage(t('trips.loadFail'));
    }
  }, [tripId, t]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip])
  );

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }
    const current = items[index];
    const target = items[targetIndex];
    await updateTripPlace(current.id, { orderIndex: target.orderIndex });
    await updateTripPlace(target.id, { orderIndex: current.orderIndex });
    loadTrip();
  };

  const toggleVisited = async (item: TripPlaceView, value: boolean) => {
    const visitDate = value ? new Date().toISOString() : null;
    await updateTripPlace(item.id, { visited: value, visitDate });
    loadTrip();
  };

  const openNotes = async (item: TripPlaceView) => {
    let tags: string[] = [];
    try {
      tags = await listTripPlaceTags(item.id);
    } catch {
      setMessage(t('trips.loadFail'));
    }
    setNoteDialog({
      id: item.id,
      notes: item.notes ?? '',
      photos: item.photos ?? [],
      tagsInput: tags.join(', '),
    });
  };

  const saveNotes = async () => {
    if (!noteDialog) {
      return;
    }
    await updateTripPlace(noteDialog.id, {
      notes: noteDialog.notes.trim() ? noteDialog.notes.trim() : null,
      photos: noteDialog.photos,
    });
    await setTripPlaceTags(noteDialog.id, parseTagInput(noteDialog.tagsInput));
    setNoteDialog(null);
    loadTrip();
  };

  const handleAddPhoto = async () => {
    if (!noteDialog) {
      return;
    }
    if (Platform.OS === 'web') {
      setMessage(t('trips.cameraUnavailable'));
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage(t('trips.cameraDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    try {
      const savedPath = await savePhotoToAppStorage(result.assets[0].uri);
      setNoteDialog((prev) =>
        prev ? { ...prev, photos: [...prev.photos, savedPath] } : prev
      );
    } catch {
      setMessage(t('trips.photoSaveFail'));
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setNoteDialog((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, photos: prev.photos.filter((photo) => photo !== uri) };
    });
  };

  const handleRemove = async (id: number) => {
    await removeTripPlace(id);
    loadTrip();
  };

  const handleRemoveTripPhoto = async (item: TripPlaceView, uri: string) => {
    const updatedPhotos = item.photos.filter((photo) => photo !== uri);
    await updateTripPlace(item.id, { photos: updatedPhotos });
    loadTrip();
  };

  const handleDeleteTrip = async () => {
    if (!trip) {
      return;
    }
    try {
      await deleteTrip(trip.id);
      router.replace('/trips');
    } catch {
      setMessage(t('trips.deleteFail'));
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader
          title={t('trips.title')}
          rightActions={
            trip ? (
              <Appbar.Action
                icon="pencil"
                onPress={() => router.push(`/trips/${trip.id}/edit`)}
              />
            ) : null
          }
        />

        <ScrollView contentContainerStyle={styles.content}>
          {trip && (
            <Card style={styles.tripCard}>
              <Card.Title title={trip.title} />
              <Card.Content style={styles.cardContent}>
                <Text>{t('trips.tripId')}: {trip.id}</Text>
                <Text>{trip.description ?? t('common.notSpecified')}</Text>
                <Text>{t('trips.start')}: {trip.startDate ?? t('common.notSpecified')}</Text>
                <Text>{t('trips.end')}: {trip.endDate ?? t('common.notSpecified')}</Text>
                <Text>
                  {t('trips.current')}: {trip.current ? t('common.yes') : t('common.no')}
                </Text>
                <Text>{t('trips.tags')}:</Text>
                <View style={styles.tagRow}>
                  {tripTags.length > 0 ? (
                    tripTags.map((tag) => (
                      <Chip key={tag} style={styles.tagChip}>
                        {tag}
                      </Chip>
                    ))
                  ) : (
                    <Text>{t('trips.tagsNone')}</Text>
                  )}
                </View>
              </Card.Content>
              <Card.Actions style={styles.tripActions}>
                <Button
                  mode="contained"
                  onPress={() => router.push(`/trips/${trip.id}/add-places`)}
                  style={styles.tripActionButton}
                  contentStyle={styles.tripActionContent}
                  labelStyle={styles.tripActionLabel}
                >
                  {t('trips.addPlaces')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setDeleteDialogVisible(true)}
                  style={styles.tripActionButton}
                  contentStyle={styles.tripActionContent}
                  labelStyle={styles.tripActionLabel}
                >
                  {t('trips.deleteTrip')}
                </Button>
              </Card.Actions>
            </Card>
          )}

          <List.Section>
            <List.Subheader>{t('trips.route')}</List.Subheader>
            {items.length === 0 && <Text>{t('trips.placesNotAdded')}</Text>}
            {items.map((item, index) => (
              <Card key={item.id} style={styles.placeCard}>
                <Card.Title
                  title={item.place?.name ?? t('common.notSpecified')}
                  subtitle={
                    item.place?.description ?? t('common.notSpecified')
                  }
                  right={() => (
                    <View style={styles.cardRight}>
                      <IconButton
                        icon="chevron-up"
                        onPress={() => moveItem(index, -1)}
                        disabled={index === 0}
                      />
                      <IconButton
                        icon="chevron-down"
                        onPress={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                      />
                    </View>
                  )}
                />
                <Card.Content style={styles.cardContent}>
                  <View style={styles.switchRow}>
                    <Text>{t('trips.visited')}</Text>
                    <Switch
                      value={item.visited}
                      onValueChange={(value) => toggleVisited(item, value)}
                    />
                  </View>
                  <Text>
                    {t('trips.visitDate')}: {formatDateTime(item.visitDate, t)}
                  </Text>
                  <Text>
                    {t('trips.notes')}: {item.notes ?? t('trips.tagsNone')}
                  </Text>
                  <Text>{t('trips.photos')}:</Text>
                  {item.photos.length > 0 ? (
                    <View style={styles.photos}>
                      {item.photos.map((photo, photoIndex) => (
                        <View
                          key={`${item.id}-photo-${photoIndex}`}
                          style={styles.photoItem}
                        >
                          <Pressable onPress={() => setFullScreenPhoto(photo)}>
                            <Image
                              source={{ uri: photo }}
                              style={styles.photoThumb}
                            />
                          </Pressable>
                          <IconButton
                            icon="close-circle"
                            size={18}
                            onPress={() => handleRemoveTripPhoto(item, photo)}
                          />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text>{t('trips.tagsNone')}</Text>
                  )}
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                  <Button mode="outlined" onPress={() => openNotes(item)}>
                    {t('trips.notesPhotos')}
                  </Button>
                  <Button mode="outlined" onPress={() => handleRemove(item.id)}>
                    {t('common.delete')}
                  </Button>
                </Card.Actions>
              </Card>
            ))}
          </List.Section>
        </ScrollView>

        <Portal>
          <Dialog
            visible={Boolean(noteDialog)}
            onDismiss={() => setNoteDialog(null)}
          >
          <Dialog.Title>{t('trips.openNotesTitle')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
              label={t('trips.notes')}
                value={noteDialog?.notes ?? ''}
                onChangeText={(value) =>
                  setNoteDialog((prev) => (prev ? { ...prev, notes: value } : prev))
                }
                mode="outlined"
                multiline
                style={styles.dialogInput}
              />
              <TextInput
                label={t('trips.tags')}
                value={noteDialog?.tagsInput ?? ''}
                onChangeText={(value) =>
                  setNoteDialog((prev) =>
                    prev ? { ...prev, tagsInput: value } : prev
                  )
                }
                mode="outlined"
                style={styles.dialogInput}
                placeholder={t('trips.noteTagsPlaceholder')}
              />
              <Button mode="outlined" onPress={handleAddPhoto}>
                {t('trips.takePhoto')}
              </Button>
              {noteDialog && noteDialog.photos.length > 0 ? (
                <View style={styles.photos}>
                  {noteDialog.photos.map((photo, photoIndex) => (
                    <View key={`dialog-photo-${photoIndex}`} style={styles.photoItem}>
                      <Pressable onPress={() => setFullScreenPhoto(photo)}>
                        <Image source={{ uri: photo }} style={styles.photoThumb} />
                      </Pressable>
                      <IconButton
                        icon="close-circle"
                        size={18}
                        onPress={() => handleRemovePhoto(photo)}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Text>{t('trips.photoMissing')}</Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
            <Button onPress={() => setNoteDialog(null)}>{t('common.cancel')}</Button>
            <Button onPress={saveNotes}>{t('common.save')}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
          >
          <Dialog.Title>{t('trips.deleteConfirmTitle')}</Dialog.Title>
            <Dialog.Content>
            <Text>{t('trips.deleteConfirmText')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteDialogVisible(false)}>
              {t('common.cancel')}
              </Button>
              <Button
                onPress={async () => {
                  setDeleteDialogVisible(false);
                  await handleDeleteTrip();
                }}
              >
              {t('common.delete')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={Boolean(message)}
          onDismiss={() => setMessage('')}
          duration={2500}
        >
          {message}
        </Snackbar>

        <Modal
          visible={Boolean(fullScreenPhoto)}
          transparent
          onRequestClose={() => setFullScreenPhoto(null)}
        >
          <View style={styles.fullScreenBackdrop}>
            <Pressable
              style={styles.fullScreenClose}
              onPress={() => setFullScreenPhoto(null)}
            >
              <Text style={styles.fullScreenCloseText}>✕</Text>
            </Pressable>
            {fullScreenPhoto && (
              <Image
                source={{ uri: fullScreenPhoto }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  tripCard: {
    marginBottom: 16,
  },
  placeCard: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 6,
  },
  cardActions: {
    flexWrap: 'wrap',
    gap: 8,
  },
  tripActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  tripActionButton: {
    width: '100%',
  },
  tripActionContent: {
    paddingVertical: 6,
  },
  tripActionLabel: {
    textAlign: 'center',
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
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogInput: {
    marginBottom: 12,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  photoItem: {
    alignItems: 'center',
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  fullScreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenClose: {
    position: 'absolute',
    top: 40,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  fullScreenCloseText: {
    color: '#ffffff',
    fontSize: 24,
  },
});

const formatDateTime = (
  value: string | null,
  t: (key: string) => string
): string => {
  if (!value) {
    return t('trips.visitDatePlaceholder');
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
