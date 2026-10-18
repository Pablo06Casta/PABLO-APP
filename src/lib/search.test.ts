import { describe, expect, it } from "vitest";
import { towns } from "../data/towns";
import { demoStays } from "../services/lodging";
import {
  bookingUrl,
  distance,
  filterStays,
  initialFilters,
  nights,
  totalPrice,
} from "./search";
import type { Market, Search } from "../types";
const query: Search = {
  town: towns[0],
  checkIn: "2027-03-27",
  checkOut: "2027-03-30",
  guests: 2,
};
const stays = demoStays(query);
describe("Precios, capacidad y distancias", () => {
  it("cuenta noches al atravesar el cambio de hora", () =>
    expect(nights(query)).toBe(3));
  it("incluye el cargo de limpieza en el total", () =>
    expect(totalPrice(stays[0], query)).toBe(150));
  it("ordena por el coste total, no por la tarifa por noche", () => {
    const a = { ...stays[0], nightly: 40, cleaningFee: 100 },
      b = { ...stays[1], nightly: 50, cleaningFee: 0 };
    expect(
      filterStays([a, b], query, initialFilters, [], "price").map(
        (s) => s.nightly,
      ),
    ).toEqual([50, 40]);
  });
  it("respeta precio, distancia y número de huéspedes", () => {
    const result = filterStays(
      stays,
      { ...query, guests: 6 },
      { ...initialFilters, maxPrice: 100 },
      [],
      "price",
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("La casa de los días tranquilos");
    expect(
      filterStays(
        stays,
        query,
        { ...initialFilters, maxDistance: 0.1 },
        [],
        "price",
      ),
    ).toHaveLength(0);
  });
  it("aplica servicios y cancelación sin perder el orden", () => {
    const result = filterStays(
      stays,
      query,
      { ...initialFilters, parking: true, kitchen: true, cancellation: true },
      [],
      "rating",
    );
    expect(result.map((s) => s.rating)).toEqual([4.96, 4.94, 4.93]);
  });
  it("no inventa supermercados para hacer pasar un filtro", () => {
    expect(
      filterStays(
        stays,
        query,
        { ...initialFilters, marketDistance: 0.5 },
        [],
        "price",
      ),
    ).toHaveLength(0);
    const market: Market = {
      id: "osm-1",
      name: "Real",
      address: "",
      lat: stays[0].lat,
      lng: stays[0].lng,
      source: "osm",
    };
    const result = filterStays(
      stays,
      query,
      { ...initialFilters, marketDistance: 0.05 },
      [market],
      "price",
    );
    expect(result.map((s) => s.id)).toEqual([stays[0].id]);
  });
  it("calcula distancias geográficas en kilómetros", () => {
    expect(distance({ lat: 40, lng: -3 }, { lat: 40, lng: -3 })).toBe(0);
    expect(distance({ lat: 40, lng: -3 }, { lat: 41, lng: -3 })).toBeCloseTo(
      111.195,
      2,
    );
  });
  it("envía fechas y huéspedes a las dos plataformas", () => {
    const booking = new URL(bookingUrl(query, "Booking")),
      airbnb = new URL(bookingUrl(query, "Airbnb"));
    expect(booking.searchParams.get("checkin")).toBe(query.checkIn);
    expect(booking.searchParams.get("checkout")).toBe(query.checkOut);
    expect(booking.searchParams.get("group_adults")).toBe("2");
    expect(airbnb.searchParams.get("checkin")).toBe(query.checkIn);
    expect(airbnb.searchParams.get("checkout")).toBe(query.checkOut);
    expect(airbnb.searchParams.get("adults")).toBe("2");
  });
});
