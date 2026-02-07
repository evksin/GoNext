import { getDb } from '../db';
import { Place } from '../models/types';

type PlaceRow = {
  id: number;
  name: string;
  description: string | null;
  visitLater: number;
  liked: number;
  dd_lat: number | null;
  dd_lng: number | null;
  photos: string | null;
  createdAt: string;
};

const parsePhotos = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapPlace = (row: PlaceRow): Place => ({
  id: row.id,
  name: row.name,
  description: row.description,
  visitLater: row.visitLater === 1,
  liked: row.liked === 1,
  ddLat: row.dd_lat,
  ddLng: row.dd_lng,
  photos: parsePhotos(row.photos),
  createdAt: row.createdAt,
});

export const listPlaces = async (): Promise<Place[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<PlaceRow>(
    'SELECT * FROM place ORDER BY createdAt DESC;'
  );
  return rows.map(mapPlace);
};

export const getPlaceById = async (id: number): Promise<Place | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<PlaceRow>(
    'SELECT * FROM place WHERE id = ?;',
    [id]
  );
  return row ? mapPlace(row) : null;
};

export const savePlace = async (place: {
  id?: number;
  name: string;
  description: string | null;
  visitLater: boolean;
  liked: boolean;
  ddLat: number | null;
  ddLng: number | null;
  photos: string[];
}): Promise<number> => {
  const db = await getDb();
  const photosJson = JSON.stringify(place.photos);

  if (place.id) {
    await db.runAsync(
      `
        UPDATE place
        SET name = ?, description = ?, visitLater = ?, liked = ?,
            dd_lat = ?, dd_lng = ?, photos = ?
        WHERE id = ?;
      `,
      [
        place.name,
        place.description,
        place.visitLater ? 1 : 0,
        place.liked ? 1 : 0,
        place.ddLat,
        place.ddLng,
        photosJson,
        place.id,
      ]
    );
    return place.id;
  }

  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `
      INSERT INTO place
        (name, description, visitLater, liked, dd_lat, dd_lng, photos, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      place.name,
      place.description,
      place.visitLater ? 1 : 0,
      place.liked ? 1 : 0,
      place.ddLat,
      place.ddLng,
      photosJson,
      createdAt,
    ]
  );
  return result.lastInsertRowId;
};

export const deletePlace = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM place WHERE id = ?;', [id]);
};
