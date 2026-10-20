import { describe, expect, it } from "vitest";
import {
  isUpcomingTournament,
  suggestedTripDates,
  tournamentCatalogue,
  tournamentVenues,
  type Tournament,
} from "./tournaments";
const base: Tournament = {
  id: "88232",
  name: "Campeonatos de España Sub-17",
  startDate: "2026-11-06",
  endDate: "2026-11-08",
  city: "Granollers",
  destination: "Granollers",
  group: "Ctos. España",
  category: "Sub-17",
  sourceUrl:
    "https://www.badminton.es/calendarevent/88232/Campeonatos-de-Espana-Sub17",
};
describe("Torneos FESBA y planificación", () => {
  it("conserva una procedencia verificable y fechas ordenadas", () => {
    const events = tournamentCatalogue.events;
    expect(events.length).toBeGreaterThan(10);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    expect(events.map((event) => event.startDate)).toEqual(
      [...events.map((event) => event.startDate)].sort(),
    );
    expect(
      events.every((event) =>
        /^https:\/\/www\.badminton\.es\/calendarevent\/\d+\//.test(
          event.sourceUrl,
        ),
      ),
    ).toBe(true);
    expect(events.some((event) => event.destination === null)).toBe(true);
  });
  it("solo ofrece pabellones utilizables de la misma ciudad, sin atribuirlos al torneo", () => {
    expect(tournamentVenues(base).map((venue) => venue.id)).toEqual([
      "granollers-congost",
    ]);
    expect(
      tournamentVenues({ ...base, destination: "Vitoria-Gasteiz" }).map(
        (venue) => venue.id,
      ),
    ).toEqual(["vitoria-aldabe", "vitoria-salburua"]);
    expect(tournamentVenues({ ...base, destination: "Ibiza" })).toEqual([]);
    expect(tournamentVenues({ ...base, destination: "Madrid" })).toEqual([]);
    expect(
      tournamentVenues({ ...base, destination: "Tudela de Duero" }).map(
        (venue) => venue.id,
      ),
    ).toEqual(["tudela-san-roque"]);
    expect(tournamentVenues({ ...base, destination: null })).toEqual([]);
  });
  it("sugiere llegada la víspera y salida tras terminar, también al cambiar de mes", () => {
    expect(suggestedTripDates(base, "2026-10-19")).toEqual({
      checkIn: "2026-11-05",
      checkOut: "2026-11-09",
    });
    expect(
      suggestedTripDates(
        { ...base, startDate: "2026-10-31", endDate: "2026-10-31" },
        "2026-10-19",
      ),
    ).toEqual({ checkIn: "2026-10-30", checkOut: "2026-11-01" });
    expect(isUpcomingTournament(base, "2026-11-07")).toBe(true);
    expect(isUpcomingTournament(base, "2026-11-09")).toBe(false);
  });
});
