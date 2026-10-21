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
  | "Casa"
  | "Habitación";
export type Search = {
  town: Town;
  venue?: Venue;
  checkIn: string;
  checkOut: string;
  guests: number;
};
export type AirbnbQuote = {
  name: string;
  url: string;
  totalPrice: number;
  distanceKm: number | null;
  notes: string;
};
export type Venue = {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  location: { lat: number; lng: number } | null;
  status: "confirmed" | "approximate" | "pending";
  sourceUrl: string;
  verifiedAt: string;
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
  bookingSearch?: boolean;
  sourceName?: string;
  bookingSourceUrl?: string;
  platform?: "Booking" | "Airbnb";
  airbnbId?: string;
  minimumNights?: number;
  approximateLocation?: boolean;
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
  platform?: "Todos" | "Booking" | "Airbnb";
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
  sourceUrl?: string;
  kind?: "supermarket" | "convenience";
  retrievedAt?: string;
  coverage?: "local" | "radius";
  cached?: boolean;
};
export type FuelStation = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours?: string;
  sourceUrl: string;
  retrievedAt: string;
  coverage: "radius" | "local";
};
export type RecentSearch = { town: Town; date: string };
export type Theme = "light" | "dark" | "system";
