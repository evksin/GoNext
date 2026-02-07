export type Migration = {
  id: number;
  name: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    id: 1,
    name: 'init-schema',
    sql: `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS place (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        visitLater INTEGER NOT NULL DEFAULT 0,
        liked INTEGER NOT NULL DEFAULT 0,
        dd_lat REAL,
        dd_lng REAL,
        dd_text TEXT,
        photos TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trip (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        startDate TEXT,
        endDate TEXT,
        createdAt TEXT NOT NULL,
        current INTEGER NOT NULL DEFAULT 0
      );

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

      CREATE TABLE IF NOT EXISTS tag (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS place_tag (
        placeId INTEGER NOT NULL,
        tagId INTEGER NOT NULL,
        PRIMARY KEY (placeId, tagId),
        FOREIGN KEY (placeId) REFERENCES place(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tag(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS trip_tag (
        tripId INTEGER NOT NULL,
        tagId INTEGER NOT NULL,
        PRIMARY KEY (tripId, tagId),
        FOREIGN KEY (tripId) REFERENCES trip(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tag(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS trip_place_tag (
        tripPlaceId INTEGER NOT NULL,
        tagId INTEGER NOT NULL,
        PRIMARY KEY (tripPlaceId, tagId),
        FOREIGN KEY (tripPlaceId) REFERENCES trip_place(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tag(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_trip_current ON trip(current);
      CREATE INDEX IF NOT EXISTS idx_trip_place_trip ON trip_place(tripId);
      CREATE INDEX IF NOT EXISTS idx_trip_place_place ON trip_place(placeId);
    `,
  },
];
