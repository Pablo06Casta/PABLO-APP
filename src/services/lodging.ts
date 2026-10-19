import type { Search, Stay } from "../types";
import catalogue from "../data/real/stays.json";
import additional from "../data/real/venue-stays.json";
import osm from "../data/real/osm-stays.json";
import priceReferences from "../data/real/hotel-price-references.json";
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

const normalizePriceName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const priceNameAliases: Record<string, string> = {
  "hotel boutique alicante palacete s xvii adults only":
    "hotel boutique alicante palacete s xvii",
  "el tiburon hotel boutique spa adults recommended":
    "el tiburon hotel boutique spa",
  "medplaya hotel riviera adults only": "medplaya hotel riviera",
  "royal oasis club at pueblo quinta by diamond resorts":
    "royal oasis club at pueblo quinta",
  "vincci seleccion aleysa hotel boutique spa": "vincci seleccion aleysa",
};

const suppliedPrices = new Map(
  priceReferences.prices.map((item) => [
    `${normalizePriceName(item.destination)}|${normalizePriceName(item.name)}`,
    item,
  ]),
);

function suppliedPrice(destination: string, name: string) {
  const normalized = normalizePriceName(name);
  const referenceName = priceNameAliases[normalized] ?? normalized;
  return suppliedPrices.get(
    `${normalizePriceName(destination)}|${referenceName}`,
  );
}

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
    .map((hotel): Stay => {
      const price = suppliedPrice(query.town.name, hotel.name);
      return ({
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
      referenceNightly: price?.nightly,
      priceReferenceSource: price?.source as Stay["priceReferenceSource"],
      priceReferenceAt: price ? priceReferences.providedAt : undefined,
      photoCredit:
        local[hotel.id] ??
        ("photo" in hotel && hotel.photo ? hotel.photo : undefined),
      });
    });
  const nearbyHotels: Stay[] = osm.hotels
    .filter((hotel) => distance(hotel, origin) <= 10)
    .map((hotel) => {
      const price = suppliedPrice(query.town.name, hotel.name);
      return ({
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
      retrievedAt:
        "retrievedAt" in hotel ? String(hotel.retrievedAt) : osm.retrievedAt,
      referenceNightly: price?.nightly,
      priceReferenceSource: price?.source as Stay["priceReferenceSource"],
      priceReferenceAt: price ? priceReferences.providedAt : undefined,
      });
    });
  return [...hotels, ...nearbyHotels];
}

export const lodgingProvider: LodgingProvider = {
  id: "verified-lodging-catalogues",
  mode: "catalogue",
  async search(query) {
    return realStays(query);
  },
};
