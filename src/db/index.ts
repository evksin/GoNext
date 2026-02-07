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
  await ensureTripSchema(db);
  await ensureTripPlaceSchema(db);
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

const ensureTripSchema = async (db: SQLiteDatabase): Promise<void> => {
  const columns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(trip);'
  );
  if (columns.length === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trip (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        startDate TEXT,
        endDate TEXT,
        createdAt TEXT NOT NULL,
        current INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
};

const ensureTripPlaceSchema = async (db: SQLiteDatabase): Promise<void> => {
  const columns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(trip_place);'
  );
  if (columns.length === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trip_place (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tripId INTEGER NOT NULL,
        placeId INTEGER NOT NULL,
        orderIndex INTEGER NOT NULL,
        visited INTEGER NOT NULL DEFAULT 0,
        visitDate TEXT,
        notes TEXT,
        photos TEXT,
        FOREIGN KEY (tripId) REFERENCES trip(id) ON DELETE CASCADE,
        FOREIGN KEY (placeId) REFERENCES place(id) ON DELETE CASCADE
      );
    `);
    return;
  }
  const names = new Set(columns.map((column) => column.name));
  if (!names.has('visitDate')) {
    await db.execAsync('ALTER TABLE trip_place ADD COLUMN visitDate TEXT;');
  }
  if (!names.has('notes')) {
    await db.execAsync('ALTER TABLE trip_place ADD COLUMN notes TEXT;');
  }
  if (!names.has('photos')) {
    await db.execAsync('ALTER TABLE trip_place ADD COLUMN photos TEXT;');
  }
};
