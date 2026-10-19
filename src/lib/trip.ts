import type { Search, Stay } from "../types";
import { venues, townForVenue } from "../data/venues";
import { realStays } from "../services/lodging";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value: string) {
  const time = Date.parse(`${value}T00:00:00Z`);
  return datePattern.test(value) && Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
export function makeTripUrl(base: string, search: Search, stays: Stay[]) {
  if (!search.venue || stays.length > 3) throw new Error("Selecciona un pabellón y hasta tres alojamientos.");
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("trip", ["1", search.venue.id, search.checkIn, search.checkOut, String(search.guests), stays.map((stay) => stay.id).join(",")].join("~"));
  return url.toString();
}
export function readTrip(raw: string): { search?: Search; stays: Stay[]; warning: string } {
  if (!raw || raw.length > 512) return { stays: [], warning: "El enlace de viaje no tiene un formato válido." };
  const parts = raw.split("~");
  if (parts.length !== 6 || parts[0] !== "1") return { stays: [], warning: "El enlace de viaje no tiene un formato válido." };
  const [, venueId, checkIn, checkOut, guestsRaw, idsRaw] = parts;
  const venue = venues.find((item) => item.id === venueId);
  const ids = idsRaw ? idsRaw.split(",") : [];
  const guests = Number(guestsRaw);
  const duration = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  if (!venue || !validDate(checkIn) || !validDate(checkOut) || !Number.isInteger(duration) || duration < 1 || duration > 365 || !/^[1-8]$/.test(guestsRaw) || !Number.isInteger(guests) || ids.length > 3 || new Set(ids).size !== ids.length || ids.some((id) => !/^[A-Za-z0-9:_-]{1,80}$/.test(id))) {
    return { stays: [], warning: "El enlace de viaje contiene datos no válidos." };
  }
  const search: Search = { town: townForVenue(venue), venue, checkIn, checkOut, guests };
  const catalogue = realStays(search);
  const stays = ids.flatMap((id) => catalogue.find((item) => item.id === id) ?? []);
  return { search, stays, warning: stays.length < ids.length ? "Uno o varios alojamientos del enlace ya no figuran en el catálogo. Conservamos el resto del viaje." : "" };
}
