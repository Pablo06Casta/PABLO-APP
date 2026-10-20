import { describe, expect, it } from "vitest";
import { venues, townForVenue } from "../data/venues";
import { realStays } from "./lodging";
import {
  distance,
  filterStays,
  initialFilters,
  stayPlatformUrl,
} from "../lib/search";
import type { Search } from "../types";

const normalizeName = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");

function queryFor(id: string): Search {
  const venue = venues.find((item) => item.id === id)!;
  return {
    venue,
    town: townForVenue(venue),
    checkIn: "2027-03-27",
    checkOut: "2027-03-30",
    guests: 3,
  };
}

describe("Más alojamientos reales cerca del pabellón", () => {
  it("amplía las ciudades con hoteles geolocalizados y conserva los filtros", () => {
    for (const id of ["vitoria-aldabe", "alicante-pitiu", "oviedo-cristo"]) {
      const query = queryFor(id);
      const results = realStays(query);
      expect(
        results.filter((stay) => stay.sourceName === "OpenStreetMap").length,
      ).toBeGreaterThan(10);
      expect(new Set(results.map((stay) => stay.id)).size).toBe(results.length);
      const filtered = filterStays(
        results,
        query,
        { ...initialFilters, platform: "Booking", maxDistance: 2 },
        [],
        "distance",
      );
      expect(filtered.length).toBeGreaterThan(0);
      for (const stay of filtered) {
        expect(stay.platform).toBe("Booking");
        expect(distance(stay, query.venue!.location!)).toBeLessThanOrEqual(2);
      }
    }
  });

  it("identifica las búsquedas por nombre y no inventa fichas ni datos comerciales", () => {
    const query = queryFor("vitoria-aldabe");
    const stays = realStays(query).filter((stay) => stay.bookingSearch);
    expect(stays.length).toBeGreaterThan(10);
    for (const stay of stays) {
      const url = new URL(stayPlatformUrl(stay, query)!);
      expect(url.pathname).toBe("/searchresults.es.html");
      expect(url.searchParams.get("ss")).toBe(`${stay.name}, ${stay.address}`);
      expect(url.searchParams.get("latitude")).toBe(String(stay.lat));
      expect(url.searchParams.get("longitude")).toBe(String(stay.lng));
      expect(url.searchParams.get("checkin")).toBe(query.checkIn);
      expect(url.searchParams.get("group_adults")).toBe("3");
      expect(url.searchParams.get("no_rooms")).toBe("2");
      expect(url.searchParams.has("dest_id")).toBe(false);
      expect(stay.bookingId).toBeUndefined();
      expect(stay.bookingPath).toBeUndefined();
      expect(stay.rating).toBeNull();
      expect(stay.nightly).toBeNull();
      expect(stay.capacity).toBeNull();
      expect(stay.freeCancellation).toBeNull();
      expect(stay.images).toEqual([]);
      expect(stay.sourceUrl).toMatch(
        /^https:\/\/www.openstreetmap.org\/(node|way|relation)\/\d+$/,
      );
    }
  });

  it("abre la ruta de Booking publicada cuando se ha verificado una fuente", () => {
    const query = queryFor("paracuellos-municipal");
    const stay = realStays(query).find(
      (item) => item.name === "Hotel Don Luis",
    )!;
    expect(stay.bookingSearch).toBe(false);
    expect(stay.bookingSourceUrl).toBe("http://hoteldonluismadrid.com/");
    const url = new URL(stayPlatformUrl(stay, query)!);
    expect(url.pathname).toBe("/hotel/es/don-luis.html");
    expect(url.searchParams.get("checkin")).toBe(query.checkIn);
  });

  it("añade tres alojamientos nuevos para San Roque sin duplicar identidades", () => {
    const query = queryFor("tudela-san-roque");
    const stays = realStays(query);
    const added = stays.filter((stay) => stay.id.startsWith("reference-tudela-"));
    expect(added.map((stay) => stay.name)).toEqual([
      "Hotel Puerta del Arco",
      "Hotel Jaramiel",
      "Hotel Ruta del Duero",
    ]);
    expect(new Set(stays.map((stay) => stay.id)).size).toBe(stays.length);
    expect(new Set(stays.map((stay) => normalizeName(stay.name))).size).toBe(stays.length);
    for (const stay of added) {
      expect(stay.approximateLocation).toBe(true);
      expect(stay.sourceName).toBe("Referencia pública por nombre y dirección");
      expect(distance(stay, query.venue!.location!)).toBeLessThanOrEqual(10);
    }
  });

  it("no incorpora precios comerciales en los alojamientos", () => {
    const stays = realStays(queryFor("alicante-pitiu"));
    expect(stays.length).toBeGreaterThan(0);
    for (const stay of stays) {
      expect(stay).not.toHaveProperty("referenceNightly");
      expect(stay).not.toHaveProperty("priceReferenceSource");
      expect(stay).not.toHaveProperty("priceReferenceAt");
    }
  });
});
