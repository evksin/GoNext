import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const baseDir = `${FileSystem.documentDirectory}gonext/`;
const photosDir = `${baseDir}photos/`;

export const ensureAppDirectories = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
};

export const getPhotosDirectory = (): string => photosDir;

export const savePhotoToAppStorage = async (sourceUri: string): Promise<string> => {
  const extensionMatch = sourceUri.split('.').pop();
  const extension = extensionMatch ? extensionMatch.split('?')[0] : 'jpg';
  const filename = `photo-${Date.now()}.${extension}`;
  const destination = `${photosDir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
};
