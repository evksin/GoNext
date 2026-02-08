import { getDb } from '../db';
import { Place, Trip } from '../models/types';

type PlaceRow = {
  id: number;
  name: string;
  description: string | null;
  visitLater: number;
  liked: number;
  dd_lat: number | null;
  dd_lng: number | null;
  dd_text: string | null;
  photos: string | null;
  createdAt: string;
};

type TripRow = {
  id: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  current: number;
};

type NoteRow = {
  tripPlaceId: number;
  tripId: number;
  tripTitle: string;
  placeId: number;
  placeName: string;
  notes: string | null;
  visitDate: string | null;
};

export type NoteSearchResult = {
  tripPlaceId: number;
  tripId: number;
  tripTitle: string;
  placeId: number;
  placeName: string;
  notes: string | null;
  visitDate: string | null;
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
  ddText: row.dd_text,
  photos: parsePhotos(row.photos),
  createdAt: row.createdAt,
});

const mapTrip = (row: TripRow): Trip => ({
  id: row.id,
  title: row.title,
  description: row.description,
  startDate: row.startDate,
  endDate: row.endDate,
  createdAt: row.createdAt,
  current: row.current === 1,
});

const buildTextFilter = (fieldA: string, fieldB: string, text: string) => {
  const escaped = `%${text}%`;
  return {
    clause: `(${fieldA} LIKE ? OR ${fieldB} LIKE ?)`,
    params: [escaped, escaped],
  };
};

export const searchPlaces = async (options: {
  text?: string;
  tags?: string[];
  year?: number;
}): Promise<Place[]> => {
  const db = await getDb();
  const { text, tags = [], year } = options;
  const params: (string | number)[] = [];
  const filters: string[] = [];
  const useTags = tags.length > 0;

  if (text) {
    const textFilter = buildTextFilter('p.name', 'p.description', text);
    filters.push(textFilter.clause);
    params.push(...textFilter.params);
  }
  if (year) {
    filters.push("strftime('%Y', p.createdAt) = ?");
    params.push(String(year));
  }
  if (useTags) {
    filters.push(`t.name IN (${tags.map(() => '?').join(',')})`);
    params.push(...tags);
  }

  let sql = `
    SELECT p.*
    FROM place p
  `;
  if (useTags) {
    sql += `
      JOIN place_tag pt ON pt.placeId = p.id
      JOIN tag t ON t.id = pt.tagId
    `;
  }
  if (filters.length > 0) {
    sql += ` WHERE ${filters.join(' AND ')} `;
  }
  if (useTags) {
    sql += ` GROUP BY p.id HAVING COUNT(DISTINCT t.id) = ${tags.length} `;
  }
  sql += ' ORDER BY p.createdAt DESC;';

  const rows = await db.getAllAsync<PlaceRow>(sql, params);
  return rows.map(mapPlace);
};

export const searchTrips = async (options: {
  text?: string;
  tags?: string[];
  year?: number;
}): Promise<Trip[]> => {
  const db = await getDb();
  const { text, tags = [], year } = options;
  const params: (string | number)[] = [];
  const filters: string[] = [];
  const useTags = tags.length > 0;

  if (text) {
    const textFilter = buildTextFilter('t.title', 't.description', text);
    filters.push(textFilter.clause);
    params.push(...textFilter.params);
  }
  if (year) {
    filters.push("strftime('%Y', COALESCE(t.startDate, t.createdAt)) = ?");
    params.push(String(year));
  }
  if (useTags) {
    filters.push(`tg.name IN (${tags.map(() => '?').join(',')})`);
    params.push(...tags);
  }

  let sql = `
    SELECT t.*
    FROM trip t
  `;
  if (useTags) {
    sql += `
      JOIN trip_tag tt ON tt.tripId = t.id
      JOIN tag tg ON tg.id = tt.tagId
    `;
  }
  if (filters.length > 0) {
    sql += ` WHERE ${filters.join(' AND ')} `;
  }
  if (useTags) {
    sql += ` GROUP BY t.id HAVING COUNT(DISTINCT tg.id) = ${tags.length} `;
  }
  sql += ' ORDER BY t.createdAt DESC;';

  const rows = await db.getAllAsync<TripRow>(sql, params);
  return rows.map(mapTrip);
};

export const searchTripNotes = async (options: {
  text?: string;
  tags?: string[];
  year?: number;
}): Promise<NoteSearchResult[]> => {
  const db = await getDb();
  const { text, tags = [], year } = options;
  const params: (string | number)[] = [];
  const filters: string[] = [];
  const useTags = tags.length > 0;

  if (text) {
    const escaped = `%${text}%`;
    filters.push('(tp.notes LIKE ? OR p.name LIKE ?)');
    params.push(escaped, escaped);
  }
  if (year) {
    filters.push(
      "strftime('%Y', COALESCE(tp.visitDate, t.startDate, t.createdAt)) = ?"
    );
    params.push(String(year));
  }
  if (useTags) {
    filters.push(`tg.name IN (${tags.map(() => '?').join(',')})`);
    params.push(...tags);
  }

  let sql = `
    SELECT
      tp.id as tripPlaceId,
      tp.tripId as tripId,
      t.title as tripTitle,
      p.id as placeId,
      p.name as placeName,
      tp.notes as notes,
      tp.visitDate as visitDate
    FROM trip_place tp
    JOIN trip t ON t.id = tp.tripId
    JOIN place p ON p.id = tp.placeId
  `;
  if (useTags) {
    sql += `
      JOIN trip_place_tag tpt ON tpt.tripPlaceId = tp.id
      JOIN tag tg ON tg.id = tpt.tagId
    `;
  }
  if (filters.length > 0) {
    sql += ` WHERE ${filters.join(' AND ')} `;
  }
  if (useTags) {
    sql += ` GROUP BY tp.id HAVING COUNT(DISTINCT tg.id) = ${tags.length} `;
  }
  sql += ' ORDER BY t.createdAt DESC;';

  const rows = await db.getAllAsync<NoteRow>(sql, params);
  return rows.map((row) => ({
    tripPlaceId: row.tripPlaceId,
    tripId: row.tripId,
    tripTitle: row.tripTitle,
    placeId: row.placeId,
    placeName: row.placeName,
    notes: row.notes,
    visitDate: row.visitDate,
  }));
};
