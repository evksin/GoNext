import { getDb } from '../db';
import { Trip, TripPlace } from '../models/types';

type TripRow = {
  id: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  current: number;
};

type TripPlaceRow = {
  id: number;
  tripId: number;
  placeId: number;
  orderIndex: number;
  visited: number;
  visitDate: string | null;
  notes: string | null;
  photos: string | null;
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

const mapTrip = (row: TripRow): Trip => ({
  id: row.id,
  title: row.title,
  description: row.description,
  startDate: row.startDate,
  endDate: row.endDate,
  createdAt: row.createdAt,
  current: row.current === 1,
});

const mapTripPlace = (row: TripPlaceRow): TripPlace => ({
  id: row.id,
  tripId: row.tripId,
  placeId: row.placeId,
  orderIndex: row.orderIndex,
  visited: row.visited === 1,
  visitDate: row.visitDate,
  notes: row.notes,
  photos: parsePhotos(row.photos),
});

export const listTrips = async (): Promise<Trip[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<TripRow>(
    'SELECT * FROM trip ORDER BY createdAt DESC;'
  );
  return rows.map(mapTrip);
};

export const getCurrentTrip = async (): Promise<Trip | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<TripRow>(
    'SELECT * FROM trip WHERE current = 1 ORDER BY createdAt DESC LIMIT 1;'
  );
  return row ? mapTrip(row) : null;
};

export const getTripById = async (id: number): Promise<Trip | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<TripRow>(
    'SELECT * FROM trip WHERE id = ?;',
    [id]
  );
  return row ? mapTrip(row) : null;
};

export const saveTrip = async (trip: {
  id?: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
}): Promise<number> => {
  const db = await getDb();

  if (trip.current) {
    await db.runAsync('UPDATE trip SET current = 0;');
  }

  if (trip.id) {
    await db.runAsync(
      `
        UPDATE trip
        SET title = ?, description = ?, startDate = ?, endDate = ?, current = ?
        WHERE id = ?;
      `,
      [
        trip.title,
        trip.description,
        trip.startDate,
        trip.endDate,
        trip.current ? 1 : 0,
        trip.id,
      ]
    );
    return trip.id;
  }

  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `
      INSERT INTO trip
        (title, description, startDate, endDate, createdAt, current)
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    [
      trip.title,
      trip.description,
      trip.startDate,
      trip.endDate,
      createdAt,
      trip.current ? 1 : 0,
    ]
  );
  return result.lastInsertRowId;
};

export const deleteTrip = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM trip WHERE id = ?;', [id]);
};

export const listTripPlaces = async (tripId: number): Promise<TripPlace[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<TripPlaceRow>(
    'SELECT * FROM trip_place WHERE tripId = ? ORDER BY orderIndex ASC;',
    [tripId]
  );
  return rows.map(mapTripPlace);
};

export const getNextTripPlace = async (
  tripId: number
): Promise<TripPlace | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<TripPlaceRow>(
    `
      SELECT *
      FROM trip_place
      WHERE tripId = ? AND visited = 0
      ORDER BY orderIndex ASC
      LIMIT 1;
    `,
    [tripId]
  );
  return row ? mapTripPlace(row) : null;
};

export const addPlaceToTrip = async (
  tripId: number,
  placeId: number
): Promise<number> => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ maxOrder: number }>(
    'SELECT MAX(orderIndex) as maxOrder FROM trip_place WHERE tripId = ?;',
    [tripId]
  );
  const nextOrder = (row?.maxOrder ?? 0) + 1;
  const result = await db.runAsync(
    `
      INSERT INTO trip_place
        (tripId, placeId, orderIndex, visited)
      VALUES (?, ?, ?, 0);
    `,
    [tripId, placeId, nextOrder]
  );
  return result.lastInsertRowId;
};

export const removeTripPlace = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM trip_place WHERE id = ?;', [id]);
};

export const updateTripPlace = async (
  id: number,
  data: {
    orderIndex?: number;
    visited?: boolean;
    visitDate?: string | null;
    notes?: string | null;
    photos?: string[];
  }
): Promise<void> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (data.orderIndex != null) {
    fields.push('orderIndex = ?');
    values.push(data.orderIndex);
  }
  if (data.visited != null) {
    fields.push('visited = ?');
    values.push(data.visited ? 1 : 0);
  }
  if (data.visitDate !== undefined) {
    fields.push('visitDate = ?');
    values.push(data.visitDate);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }
  if (data.photos !== undefined) {
    fields.push('photos = ?');
    values.push(JSON.stringify(data.photos));
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  await db.runAsync(
    `UPDATE trip_place SET ${fields.join(', ')} WHERE id = ?;`,
    values
  );
};
