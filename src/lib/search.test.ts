import { describe, expect, it } from "vitest";
import { towns } from "../data/towns";
import { townForVenue, venues } from "../data/venues";
import { realStays } from "../services/lodging";
import {
  bookingUrl,
  distance,
  filterStays,
  initialFilters,
  nights,
  stayBookingUrl,
  totalPrice,
} from "./search";
import type { Market, Search } from "../types";
const query: Search = {
  town: towns[0],
  checkIn: "2027-03-27",
  checkOut: "2027-03-30",
  guests: 2,
};
const stays = realStays(query);
describe("Catálogo real, enlaces y filtros", () => {
  it("cuenta noches al atravesar el cambio de hora", () =>
    expect(nights(query)).toBe(3));
  it("no crea precios, reseñas ni capacidades en hoteles reales", () => {
    expect(stays.length).toBeGreaterThan(10);
    expect(stays.some((s) => s.name === "Eurostars Puerta Real")).toBe(true);
    for (const stay of stays) {
      expect(stay.nightly).toBeNull();
      expect(stay.rating).toBeNull();
      expect(stay.capacity).toBeNull();
      expect(totalPrice(stay, query)).toBeNull();
      expect(stay.sourceUrl).toMatch(
        /^https:\/\/www.wikidata.org\/wiki\/Q\d+$/,
      );
      expect(stay.bookingId || stay.bookingPath).toBeTruthy();
    }
  });
  it("no confirma ni rechaza una capacidad desconocida al cambiar huéspedes", () => {
    expect(
      filterStays(
        stays,
        { ...query, guests: 8 },
        initialFilters,
        [],
        "distance",
      ).length,
    ).toBe(filterStays(stays, query, initialFilters, [], "distance").length);
  });
  it("no hace pasar los datos desconocidos por filtros de precio, valoración o cancelación", () => {
    expect(
      filterStays(
        stays,
        query,
        { ...initialFilters, minRating: 4 },
        [],
        "distance",
      ),
    ).toHaveLength(0);
    expect(
      filterStays(
        stays,
        query,
        { ...initialFilters, maxPrice: 5 },
        [],
        "distance",
      ),
    ).toHaveLength(0);
    expect(
      filterStays(
        stays,
        query,
        { ...initialFilters, cancellation: true },
        [],
        "distance",
      ),
    ).toHaveLength(0);
  });
  it("calcula la distancia real y aplica proximidad a tiendas registradas", () => {
    expect(distance({ lat: 40, lng: -3 }, { lat: 41, lng: -3 })).toBeCloseTo(
      111.195,
      2,
    );
    const stay = stays[0];
    const market: Market = {
      id: "osm-1",
      name: "Real",
      address: "",
      lat: stay.lat,
      lng: stay.lng,
      source: "osm",
    };
    expect(
      filterStays(
        [stay],
        query,
        { ...initialFilters, marketDistance: 0.05 },
        [],
        "distance",
      ),
    ).toHaveLength(0);
    expect(
      filterStays(
        [stay],
        query,
        { ...initialFilters, marketDistance: 0.05 },
        [market],
        "distance",
      ),
    ).toHaveLength(1);
  });
  it("abre el identificador de ese hotel con fechas y huéspedes, no una búsqueda genérica", () => {
    const stay = stays.find((s) => s.name === "Eurostars Puerta Real")!;
    const url = new URL(stayBookingUrl(stay, query)!);
    expect(url.hostname).toBe("www.booking.com");
    expect(url.searchParams.get("dest_type")).toBe("hotel");
    expect(url.searchParams.get("dest_id")).toBe("90089");
    expect(url.searchParams.get("highlighted_hotels")).toBe("90089");
    expect(url.searchParams.get("checkin")).toBe(query.checkIn);
    expect(url.searchParams.get("checkout")).toBe(query.checkOut);
    expect(url.searchParams.get("group_adults")).toBe("2");
  });
  it("usa la ruta publicada cuando existe y no inventa slugs a partir del nombre", () => {
    const url = new URL(
      stayBookingUrl(
        { ...stays[0], bookingPath: "es/hilton-diagonal-mar-barcelona" },
        query,
      )!,
    );
    expect(url.pathname).toBe("/hotel/es/hilton-diagonal-mar-barcelona.html");
    expect(
      stayBookingUrl(
        { ...stays[0], bookingId: undefined, bookingPath: undefined },
        query,
      ),
    ).toBeUndefined();
    expect(
      stayBookingUrl(
        { ...stays[0], bookingId: "inventado", bookingPath: undefined },
        query,
      ),
    ).toBeUndefined();
  });
  it("envía las fechas a las búsquedas externas opcionales", () => {
    for (const platform of ["Booking", "Airbnb"] as const)
      expect(
        new URL(bookingUrl(query, platform)).searchParams.get("checkin"),
      ).toBe(query.checkIn);
  });
  it("ofrece la búsqueda de Airbnb en todas las sedes con alojamientos", () => {
    const available = venues.filter((venue) => venue.location);
    expect(available.length).toBeGreaterThan(0);
    for (const venue of available) {
      const search: Search = { ...query, town: townForVenue(venue), venue };
      const url = new URL(bookingUrl(search, "Airbnb"));
      expect(url.hostname).toBe("www.airbnb.es");
      expect(url.searchParams.get("lat")).toBe(String(venue.location!.lat));
      expect(url.searchParams.get("lng")).toBe(String(venue.location!.lng));
      expect(url.searchParams.get("adults")).toBe(String(query.guests));
    }
  });
});
