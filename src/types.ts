export type Town = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  approximate?: boolean;
};
export type StayType =
  "Todos" | "Apartamento" | "Hotel" | "Casa rural" | "Habitación";
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
  nightly: number;
  cleaningFee: number;
  rating: number;
  reviews: number;
  capacity: number;
  lat: number;
  lng: number;
  address: string;
  images: string[];
  amenities: string[];
  freeCancellation: boolean;
  demo: boolean;
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
};
export type RecentSearch = { town: Town; date: string };
export type Theme = "light" | "dark" | "system";
