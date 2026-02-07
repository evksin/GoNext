import * as SQLite from 'expo-sqlite';

import { migrations } from './migrations';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('gonext.db');
  }
  return dbPromise;
};

export const initDb = async (): Promise<void> => {
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
};
