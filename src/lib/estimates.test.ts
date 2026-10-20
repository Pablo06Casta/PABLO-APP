import { describe, expect, it } from "vitest";
import type { Search, Stay } from "../types";
import {
  defaultVenue,
  searchOrigin,
  townForVenue,
  venues,
} from "../data/venues";
import { estimateStay } from "./estimates";
import { filterStays, initialFilters, nights, stayPlatformUrl } from "./search";
import { realStays } from "../services/lodging";
const query: Search = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: "2027-03-27",
  checkOut: "2027-03-30",
  guests: 2,
};
const hotel: Stay = {
  ...realStays(query).find((s) => s.platform === "Booking")!,
};
const apartment: Stay = {
  ...hotel,
  id: "airbnb-1234567890123456789",
  platform: "Airbnb",
  airbnbId: "1234567890123456789",
  type: "Apartamento",
  minimumNights: 2,
  capacity: 4,
};
describe("Presupuestos orientativos para el torneo", () => {
  it("no genera precios distintos por nombre o ID para aparentar que un hotel es más barato", () => {
    const a = estimateStay(hotel, query),
      b = estimateStay({ ...hotel, name: "Otro hotel", id: "another" }, query);
    expect(a.perPersonNight).toBe(b.perPersonNight);
    expect(a.source).toBe("model");
    expect(a.explanation).toContain("No es una tarifa observada");
    expect(a.low).toBeLessThan(a.perPersonNight);
    expect(a.high).toBeGreaterThan(a.perPersonNight);
  });
  it("presupuesta habitaciones dobles para grupos impares y compara por persona", () => {
    const result = estimateStay(hotel, { ...query, guests: 3 });
    expect(result.rooms).toBe(2);
    expect(result.totalGroup).toBe(result.nightlyGroup * nights(query));
    expect(
      new URL(
        stayPlatformUrl(hotel, { ...query, guests: 3 })!,
      ).searchParams.get("no_rooms"),
    ).toBe("2");
  });
  it("usa únicamente el modelo propio de ciudad, temporada y categoría", () => {
    const regular = estimateStay(hotel, query);
    const summer = estimateStay(hotel, {
      ...query,
      checkIn: "2027-07-10",
      checkOut: "2027-07-12",
    });
    expect(regular.source).toBe("model");
    expect(summer.source).toBe("model");
    expect(summer.nightlyGroup).toBeGreaterThan(regular.nightlyGroup);
    expect(summer.explanation).toContain("Modelo propio de CERCA");
    expect(summer.explanation).toContain("No es una tarifa observada");
  });
  it("calcula una vivienda con el modelo propio sin multiplicarla por habitaciones", () => {
    const result = estimateStay(apartment, { ...query, guests: 4 });
    expect(result.rooms).toBe(1);
    expect(result.source).toBe("model");
    expect(result.totalGroup).toBe(result.nightlyGroup * 3);
  });
  it("filtra por el mismo presupuesto central usado al ordenar, de menor a mayor", () => {
    const cheap = { ...hotel, id: "cheap", type: "Habitación" as const },
      expensive = { ...hotel, id: "expensive", type: "Apartamento" as const };
    expect(
      filterStays(
        [expensive, cheap],
        query,
        { ...initialFilters, maxPrice: 200 },
        [],
        "price",
      ).map((s) => s.id),
    ).toEqual(["cheap", "expensive"]);
    expect(
      filterStays(
        [expensive, cheap],
        query,
        { ...initialFilters, maxPrice: 40, platform: "Booking" },
        [],
        "price",
      ).map((s) => s.id),
    ).toEqual(["cheap"]);
  });
  it("no ofrece una vivienda que incumpla capacidad o estancia mínima publicadas", () => {
    expect(
      filterStays(
        [apartment],
        { ...query, guests: 5 },
        initialFilters,
        [],
        "price",
      ),
    ).toHaveLength(0);
    expect(
      filterStays(
        [{ ...apartment, minimumNights: 4 }],
        query,
        initialFilters,
        [],
        "price",
      ),
    ).toHaveLength(0);
  });
  it("usa la ubicación del pabellón aunque el centro de ciudad esté lejos", () => {
    const origin = searchOrigin(query);
    const venueStay = {
      ...hotel,
      id: "venue-stay",
      lat: origin.lat,
      lng: origin.lng,
    };
    const townStay = { ...hotel, id: "town-stay", lat: 1, lng: 1 };
    const farCity = { ...query, town: { ...query.town, lat: 1, lng: 1 } };
    expect(
      filterStays(
        [townStay, venueStay],
        farCity,
        { ...initialFilters, maxDistance: 1 },
        [],
        "distance",
      ).map((s) => s.id),
    ).toEqual(["venue-stay"]);
  });
  it("conserva IDs largos de Airbnb y abre la ficha con fechas y huéspedes", () => {
    const url = new URL(stayPlatformUrl(apartment, query)!);
    expect(url.pathname).toBe("/rooms/1234567890123456789");
    expect(url.searchParams.get("check_in")).toBe(query.checkIn);
    expect(url.searchParams.get("check_out")).toBe(query.checkOut);
    expect(url.searchParams.get("adults")).toBe("2");
  });
  it("incluye las instalaciones y evita recomendaciones falsas donde no hay coordenadas confirmadas", () => {
    expect(venues.length).toBeGreaterThanOrEqual(23);
    for (const venue of venues.filter((v) => !v.location)) {
      expect(realStays({ ...query, venue })).toEqual([]);
      expect(
        filterStays([hotel], { ...query, venue }, initialFilters, [], "price"),
      ).toEqual([]);
    }
  });
});
