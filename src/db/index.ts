import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrations } from './migrations';

let dbPromise: Promise<SQLiteDatabase> | null = null;

const openDatabase = async (): Promise<SQLiteDatabase> => {
  if (Platform.OS === 'web') {
    throw new Error('SQLite не поддерживается в браузере.');
  }
  const SQLite = await import('expo-sqlite');
  return SQLite.openDatabaseAsync('gonext.db');
};

export const getDb = async (): Promise<SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
};

export const initDb = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  const db = await getDb();

  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      appliedAt TEXT NOT NULL
    );
  `);

  const applied = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM migrations ORDER BY id ASC;'
  );
  const appliedIds = new Set(applied.map((row) => row.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    await db.execAsync('BEGIN;');
    try {
      await db.execAsync(migration.sql);
      await db.runAsync(
        'INSERT INTO migrations (id, name, appliedAt) VALUES (?, ?, ?);',
        [migration.id, migration.name, new Date().toISOString()]
      );
      await db.execAsync('COMMIT;');
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  await ensurePlaceCoordinatesColumns(db);
};

const ensurePlaceCoordinatesColumns = async (
  db: SQLiteDatabase
): Promise<void> => {
  const columns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(place);'
  );
  const names = new Set(columns.map((column) => column.name));

  if (!names.has('dd_lat')) {
    await db.execAsync('ALTER TABLE place ADD COLUMN dd_lat REAL;');
  }
  if (!names.has('dd_lng')) {
    await db.execAsync('ALTER TABLE place ADD COLUMN dd_lng REAL;');
  }
  if (!names.has('dd_text')) {
    await db.execAsync('ALTER TABLE place ADD COLUMN dd_text TEXT;');
  }
};
