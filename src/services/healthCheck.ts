import { Platform } from 'react-native';
import i18next from 'i18next';

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
        label: i18next.t('health.offline'),
        ok: false,
        details: i18next.t('health.offlineWeb'),
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
      label: i18next.t('health.db'),
      ok: true,
      details: i18next.t('health.dbDetails', {
        places: placeCount?.count ?? 0,
        trips: tripCount?.count ?? 0,
      }),
    });
  } catch (error) {
    items.push({
      label: i18next.t('health.db'),
      ok: false,
      details: error instanceof Error ? error.message : i18next.t('common.errorUnknown'),
    });
  }

  try {
    await ensureAppDirectories();
    const dir = getPhotosDirectory();
    const files = await FileSystem.readDirectoryAsync(dir);
    items.push({
      label: i18next.t('health.storage'),
      ok: true,
      details: i18next.t('health.storageDetails', { count: files.length }),
    });
  } catch (error) {
    items.push({
      label: i18next.t('health.storage'),
      ok: false,
      details: error instanceof Error ? error.message : i18next.t('common.errorUnknown'),
    });
  }

  items.push({
    label: i18next.t('health.offline'),
    ok: true,
    details: i18next.t('health.offlineOk'),
  });

  return items;
};
