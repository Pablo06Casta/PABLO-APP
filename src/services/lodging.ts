import type { Search, Stay } from "../types";
import catalogue from "../data/real/stays.json";
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
  return catalogue.hotels
    .filter((hotel) => distance(hotel, query.town) <= 10)
    .map(
      (hotel): Stay => ({
        id: hotel.id,
        name: hotel.name,
        type: "Hotel",
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
}

export const lodgingProvider: LodgingProvider = {
  id: "wikidata-spain-booking",
  mode: "catalogue",
  async search(query) {
    return realStays(query);
  },
};
