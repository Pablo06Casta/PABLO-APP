import { describe, expect, it } from "vitest";
import { defaultVenue, townForVenue, venues } from "../data/venues";
import { realStays } from "../services/lodging";
import { groupBudget } from "./groupBudget";
import { routeUrl } from "./routes";
import { makeTripUrl, readTrip } from "./trip";
import type { Search } from "../types";

const search: Search = { venue: defaultVenue, town: townForVenue(defaultVenue), checkIn: "2026-11-10", checkOut: "2026-11-13", guests: 3 };
const stays = realStays(search).slice(0, 2);

describe("viaje, presupuesto y desplazamientos", () => {
  it("recupera el viaje con identificadores actuales y conserva opciones existentes si se retira una", () => {
    const url = new URL(makeTripUrl("https://example.org/PABLO-APP/", search, stays));
    const restored = readTrip(url.searchParams.get("trip")!);
    expect(restored.search).toMatchObject({ venue: defaultVenue, guests: 3, checkIn: search.checkIn, checkOut: search.checkOut });
    expect(restored.stays.map((stay) => stay.id)).toEqual(stays.map((stay) => stay.id));
    const removed = readTrip(url.searchParams.get("trip")!.replace(stays[1].id, "retired-123"));
    expect(removed.stays.map((stay) => stay.id)).toEqual([stays[0].id]);
    expect(removed.warning).toContain("ya no figuran");
  });
  it("rechaza fechas, cantidades, identificadores y longitud manipulados", () => {
    for (const raw of ["1~bad~2026-11-10~2026-11-13~3~", "1~vitoria-aldabe~2026-02-30~2026-03-02~3~", "1~vitoria-aldabe~2026-11-10~2026-11-13~0~", "1~vitoria-aldabe~2026-11-10~2026-11-13~3~bad!", "x".repeat(513)]) {
      expect(readTrip(raw).search).toBeUndefined();
    }
  });
  it("suma una sola alternativa, comida por días y divide sin cero", () => {
    const budget = groupBudget(search, stays[0], 120.5, 20.25, 3, 15, 3)!;
    expect(budget.food).toBe(182.25);
    expect(budget.total).toBe(budget.lodging + 317.75);
    expect(budget.perPerson).toBeCloseTo(budget.total / 3);
    expect(groupBudget(search, stays[0], -1, 0, 3, 0, 3)).toBeNull();
    expect(groupBudget(search, stays[0], 0, 0, 3, 0, 0)).toBeNull();
  });
  it("apunta cada modo al alojamiento y pabellón elegidos y omite sedes pendientes", () => {
    for (const mode of ["walking", "driving", "transit"] as const) {
      const url = new URL(routeUrl(stays[0], search, mode)!);
      expect(url.searchParams.get("origin")).toBe(`${stays[0].lat},${stays[0].lng}`);
      expect(url.searchParams.get("destination")).toBe(`${defaultVenue.location!.lat},${defaultVenue.location!.lng}`);
      expect(url.searchParams.get("travelmode")).toBe(mode);
    }
    const pending = venues.find((venue) => venue.status === "pending")!;
    expect(routeUrl(stays[0], { ...search, venue: pending }, "walking")).toBeNull();
  });
});
