import { Platform } from 'react-native';

import { getDb } from '../db';
import { ensureAppDirectories, getPhotosDirectory } from './storage';
import * as FileSystem from 'expo-file-system/legacy';

export type HealthItem = {
  label: string;
  ok: boolean;
  details?: string;
};

export const runOfflineCheck = async (): Promise<HealthItem[]> => {
  if (Platform.OS === 'web') {
    return [
      {
        label: 'Офлайн-режим',
        ok: false,
        details: 'В браузере SQLite недоступен.',
      },
    ];
  }

  const items: HealthItem[] = [];

  try {
    const db = await getDb();
    await db.getFirstAsync('SELECT 1;');
    const placeCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM place;'
    );
    const tripCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM trip;'
    );
    items.push({
      label: 'Локальная база данных',
      ok: true,
      details: `мест: ${placeCount?.count ?? 0}, поездок: ${tripCount?.count ?? 0}`,
    });
  } catch (error) {
    items.push({
      label: 'Локальная база данных',
      ok: false,
      details: error instanceof Error ? error.message : 'ошибка',
    });
  }

  try {
    await ensureAppDirectories();
    const dir = getPhotosDirectory();
    const files = await FileSystem.readDirectoryAsync(dir);
    items.push({
      label: 'Локальное хранилище фото',
      ok: true,
      details: `файлов: ${files.length}`,
    });
  } catch (error) {
    items.push({
      label: 'Локальное хранилище фото',
      ok: false,
      details: error instanceof Error ? error.message : 'ошибка',
    });
  }

  items.push({
    label: 'Офлайн-режим',
    ok: true,
    details: 'Приложение работает без сети (SQLite + файлы).',
  });

  return items;
};
