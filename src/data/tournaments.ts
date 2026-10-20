import catalogue from "./real/fesba-calendar.json";
import { venues } from "./venues";
import type { Venue } from "../types";

export type Tournament = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  city: string;
  destination: string | null;
  group: string;
  category: string;
  sourceUrl: string;
};

export const tournamentCatalogue = catalogue as {
  source: string;
  retrievedAt: string;
  updatedYears: number[];
  scope: string;
  events: Tournament[];
};

export function dateInSpain(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function tournamentVenues(event: Tournament): Venue[] {
  // La federación publica ciudad, no pabellón. Solo ofrecemos instalaciones
  // confirmadas de CERCA en el mismo destino y exigimos elección explícita.
  return event.destination
    ? venues.filter(
        (venue) =>
          venue.city === event.destination && venue.status !== "pending",
      )
    : [];
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function suggestedTripDates(event: Tournament, today = dateInSpain()) {
  const checkIn = [addDays(event.startDate, -1), today].sort().at(-1)!;
  const departure = addDays(event.endDate ?? event.startDate, 1);
  const checkOut = [departure, addDays(checkIn, 1)].sort().at(-1)!;
  return { checkIn, checkOut };
}

export function isUpcomingTournament(event: Tournament, today = dateInSpain()) {
  return (event.endDate ?? event.startDate) >= today;
}
