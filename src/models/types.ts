export type Place = {
  id: number;
  name: string;
  description: string | null;
  visitLater: boolean;
  liked: boolean;
  ddLat: number | null;
  ddLng: number | null;
  ddText: string | null;
  photos: string[];
  createdAt: string;
};

export type Trip = {
  id: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  current: boolean;
};

export type TripPlace = {
  id: number;
  tripId: number;
  placeId: number;
  orderIndex: number;
  visited: boolean;
  visitDate: string | null;
  notes: string | null;
  photos: string[];
};

export type Tag = {
  id: number;
  name: string;
};
