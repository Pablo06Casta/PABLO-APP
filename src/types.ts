export type Town = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  approximate?: boolean;
};
export type StayType =
  | "Todos"
  | "Apartamento"
  | "Hotel"
  | "Casa rural"
  | "Habitación";
export type Search = {
  town: Town;
  checkIn: string;
  checkOut: string;
  guests: number;
};
export type Stay = {
  id: string;
  name: string;
  type: Exclude<StayType, "Todos">;
  nightly: number | null;
  cleaningFee: number | null;
  rating: number | null;
  reviews: number | null;
  capacity: number | null;
  lat: number;
  lng: number;
  address: string;
  images: string[];
  amenities: string[];
  freeCancellation: boolean | null;
  bookingId?: string;
  bookingPath?: string;
  sourceUrl: string;
  retrievedAt: string;
  photoCredit?: {
    author: string;
    licence: string;
    licenceUrl: string;
    source: string;
  };
};
export type Filters = {
  minPrice: number;
  maxPrice: number;
  maxDistance: number;
  type: StayType;
  minRating: number;
  cancellation: boolean;
  parking: boolean;
  kitchen: boolean;
  marketDistance: number;
};
export type Market = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours?: string;
  source: "osm";
  retrievedAt?: string;
  coverage?: "local" | "radius";
  cached?: boolean;
};
export type RecentSearch = { town: Town; date: string };
export type Theme = "light" | "dark" | "system";
