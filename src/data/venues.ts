import catalogue from "./venues.json";
import { normalize, towns } from "./towns";
import type { Search, Town, Venue } from "../types";

export const venues = catalogue as Venue[];
export const defaultVenue = venues.find((v) => v.id === "vitoria-aldabe")!;
export function townForVenue(venue: Venue): Town {
  const known = towns.find((t) => normalize(t.name) === normalize(venue.city));
  return (
    known ?? {
      id: `city-${venue.id}`,
      name: venue.city,
      region: venue.region,
      lat: venue.location?.lat ?? 0,
      lng: venue.location?.lng ?? 0,
    }
  );
}
export function searchOrigin(search: Search): Town {
  return search.venue?.location
    ? {
        id: search.venue.id,
        name: search.venue.name,
        region: search.venue.region,
        ...search.venue.location,
      }
    : search.town;
}
export function venueLabel(search: Search) {
  return search.venue ? search.venue.name : `centro de ${search.town.name}`;
}
export function venueDirections(search: Search) {
  const origin = searchOrigin(search);
  return search.venue && !search.venue.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${search.venue.name}, ${search.venue.city}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${origin.lat},${origin.lng}`;
}
