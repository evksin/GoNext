import { getDb } from '../db';

type TagRow = {
  id: number;
  name: string;
};

export const parseTagInput = (input: string): string[] => {
  const raw = input
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    const normalized = item.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

const getOrCreateTagIds = async (names: string[]): Promise<number[]> => {
  if (names.length === 0) {
    return [];
  }
  const db = await getDb();
  for (const name of names) {
    await db.runAsync('INSERT OR IGNORE INTO tag (name) VALUES (?);', [name]);
  }
  const placeholders = names.map(() => '?').join(',');
  const rows = await db.getAllAsync<TagRow>(
    `SELECT id, name FROM tag WHERE name IN (${placeholders});`,
    names
  );
  return rows.map((row) => row.id);
};

const listTagNames = async (sql: string, params: (string | number)[]) => {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string }>(sql, params);
  return rows.map((row) => row.name);
};

export const listPlaceTags = async (placeId: number): Promise<string[]> =>
  listTagNames(
    `
      SELECT t.name
      FROM tag t
      JOIN place_tag pt ON pt.tagId = t.id
      WHERE pt.placeId = ?
      ORDER BY t.name;
    `,
    [placeId]
  );

export const listTripTags = async (tripId: number): Promise<string[]> =>
  listTagNames(
    `
      SELECT t.name
      FROM tag t
      JOIN trip_tag tt ON tt.tagId = t.id
      WHERE tt.tripId = ?
      ORDER BY t.name;
    `,
    [tripId]
  );

export const listTripPlaceTags = async (
  tripPlaceId: number
): Promise<string[]> =>
  listTagNames(
    `
      SELECT t.name
      FROM tag t
      JOIN trip_place_tag tpt ON tpt.tagId = t.id
      WHERE tpt.tripPlaceId = ?
      ORDER BY t.name;
    `,
    [tripPlaceId]
  );

const setTagLinks = async (
  deleteSql: string,
  insertSql: string,
  entityId: number,
  names: string[]
) => {
  const db = await getDb();
  const tagIds = await getOrCreateTagIds(names);
  await db.runAsync(deleteSql, [entityId]);
  for (const tagId of tagIds) {
    await db.runAsync(insertSql, [entityId, tagId]);
  }
};

export const setPlaceTags = async (placeId: number, names: string[]) =>
  setTagLinks(
    'DELETE FROM place_tag WHERE placeId = ?;',
    'INSERT INTO place_tag (placeId, tagId) VALUES (?, ?);',
    placeId,
    names
  );

export const setTripTags = async (tripId: number, names: string[]) =>
  setTagLinks(
    'DELETE FROM trip_tag WHERE tripId = ?;',
    'INSERT INTO trip_tag (tripId, tagId) VALUES (?, ?);',
    tripId,
    names
  );

export const setTripPlaceTags = async (tripPlaceId: number, names: string[]) =>
  setTagLinks(
    'DELETE FROM trip_place_tag WHERE tripPlaceId = ?;',
    'INSERT INTO trip_place_tag (tripPlaceId, tagId) VALUES (?, ?);',
    tripPlaceId,
    names
  );
