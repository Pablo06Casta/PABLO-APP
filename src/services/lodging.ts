import type { Search, Stay } from "../types";
import catalogue from "../data/real/stays.json";
import additional from "../data/real/venue-stays.json";
import airbnb from "../data/real/airbnb.json";
import osm from "../data/real/osm-stays.json";
import { searchOrigin } from "../data/venues";
import localPhotos from "../data/real/local-photos.json";
import { distance } from "../lib/search";
const local = localPhotos as Record<
  string,
  {
    url: string;
    author: string;
    licence: string;
    licenceUrl: string;
    source: string;
  }
>;

export interface LodgingProvider {
  id: string;
  mode: "catalogue" | "live";
  search(query: Search): Promise<Stay[]>;
}

// Identidad y coordenadas CC0. La fuente no proporciona tarifas ni disponibilidad.
// Los identificadores de Booking proceden de P10532/P3607, nunca del nombre.
export function realStays(query: Search): Stay[] {
  if (query.venue && !query.venue.location) return [];
  const origin = searchOrigin(query);
  const hotels = [...catalogue.hotels, ...additional.hotels]
    .filter((hotel) => distance(hotel, origin) <= 10)
    .map(
      (hotel): Stay => ({
        id: hotel.id,
        name: hotel.name,
        type: "Hotel",
        platform: "Booking",
        nightly: null,
        cleaningFee: null,
        rating: null,
        reviews: null,
        capacity: null,
        lat: hotel.lat,
        lng: hotel.lng,
        address: "Coordenadas del catálogo Wikidata",
        images: local[hotel.id]
          ? [`${import.meta.env.BASE_URL}stays/${hotel.id}.jpg`]
          : "photo" in hotel && hotel.photo
            ? [hotel.photo.url]
            : [],
        amenities: [],
        freeCancellation: null,
        bookingId: "bookingId" in hotel ? hotel.bookingId : undefined,
        bookingPath: "bookingPath" in hotel ? hotel.bookingPath : undefined,
        sourceUrl: `https://www.wikidata.org/wiki/${hotel.id}`,
        retrievedAt: catalogue.retrievedAt,
        photoCredit:
          local[hotel.id] ??
          ("photo" in hotel && hotel.photo ? hotel.photo : undefined),
      }),
    );
  const apartments: Stay[] = airbnb.listings
    .filter((stay) => distance(stay, origin) <= 10)
    .map((stay) => ({
      id: stay.id,
      name: stay.name,
      type: stay.type as Stay["type"],
      platform: "Airbnb",
      airbnbId: stay.airbnbId,
      observedNightly: stay.observedNightly,
      observedAt: stay.observedAt,
      minimumNights: stay.minimumNights,
      capacity: stay.capacity,
      lat: stay.lat,
      lng: stay.lng,
      approximateLocation: true,
      nightly: null,
      cleaningFee: null,
      rating: null,
      reviews: null,
      address:
        "Ubicación aproximada publicada; confirma la dirección con el anfitrión.",
      images: [],
      amenities: stay.amenities,
      freeCancellation: null,
      sourceUrl: airbnb.sourceUrl,
      retrievedAt: airbnb.retrievedAt,
    }));
  const nearbyHotels: Stay[] = osm.hotels
    .filter((hotel) => distance(hotel, origin) <= 10)
    .map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      type: hotel.type as Stay["type"],
      platform: "Booking",
      bookingPath:
        "bookingPath" in hotel ? String(hotel.bookingPath) : undefined,
      bookingSearch: !("bookingPath" in hotel),
      bookingSourceUrl:
        "bookingSourceUrl" in hotel
          ? String(hotel.bookingSourceUrl)
          : undefined,
      sourceName: "OpenStreetMap",
      nightly: null,
      cleaningFee: null,
      rating: null,
      reviews: null,
      capacity: null,
      lat: hotel.lat,
      lng: hotel.lng,
      address: hotel.address,
      images: [],
      amenities: [],
      freeCancellation: null,
      sourceUrl: hotel.sourceUrl,
      retrievedAt: osm.retrievedAt,
    }));
  return [...hotels, ...nearbyHotels, ...apartments];
}

export const lodgingProvider: LodgingProvider = {
  id: "verified-lodging-catalogues",
  mode: "catalogue",
  async search(query) {
    return realStays(query);
  },
};
