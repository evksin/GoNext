import * as FileSystem from 'expo-file-system';

const baseDir = `${FileSystem.documentDirectory}gonext/`;
const photosDir = `${baseDir}photos/`;

export const ensureAppDirectories = async (): Promise<void> => {
  await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
};

export const getPhotosDirectory = (): string => photosDir;
