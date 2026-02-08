import { getDb } from '../db';

export type BackupData = {
  version: 1;
  exportedAt: string;
  data: {
    place: Record<string, unknown>[];
    trip: Record<string, unknown>[];
    trip_place: Record<string, unknown>[];
    tag: Record<string, unknown>[];
    place_tag: Record<string, unknown>[];
    trip_tag: Record<string, unknown>[];
    trip_place_tag: Record<string, unknown>[];
  };
};

const tableList = [
  'place',
  'trip',
  'trip_place',
  'tag',
  'place_tag',
  'trip_tag',
  'trip_place_tag',
] as const;

export const exportDatabase = async (): Promise<string> => {
  const db = await getDb();
  const result: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      place: [],
      trip: [],
      trip_place: [],
      tag: [],
      place_tag: [],
      trip_tag: [],
      trip_place_tag: [],
    },
  };

  for (const table of tableList) {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM ${table};`
    );
    result.data[table] = rows;
  }

  return JSON.stringify(result, null, 2);
};

export const clearDatabase = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync('BEGIN;');
  try {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    for (const table of tableList) {
      await db.execAsync(`DELETE FROM ${table};`);
    }
    await db.execAsync(
      `DELETE FROM sqlite_sequence WHERE name IN (${tableList
        .map((name) => `'${name}'`)
        .join(',')});`
    );
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};

export const importDatabase = async (rawJson: string): Promise<void> => {
  const parsed = JSON.parse(rawJson) as BackupData;
  if (!parsed || parsed.version !== 1 || !parsed.data) {
    throw new Error('Неверный формат данных.');
  }
  const db = await getDb();
  await db.execAsync('BEGIN;');
  try {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    for (const table of tableList) {
      await db.execAsync(`DELETE FROM ${table};`);
    }
    for (const table of tableList) {
      const rows = parsed.data[table] ?? [];
      for (const row of rows) {
        const keys = Object.keys(row);
        if (keys.length === 0) {
          continue;
        }
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map((key) => (row as Record<string, unknown>)[key]);
        await db.runAsync(
          `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders});`,
          values
        );
      }
    }
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};
