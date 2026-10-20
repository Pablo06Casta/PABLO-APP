import type { Search, Stay } from "../types";
export type RouteMode = "walking" | "driving" | "transit";
export function routeUrl(stay: Stay, search: Search, mode: RouteMode) {
  const venue = search.venue;
  if (!venue || venue.status === "pending" || !venue.location) return null;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${stay.lat},${stay.lng}`);
  url.searchParams.set("destination", `${venue.location.lat},${venue.location.lng}`);
  url.searchParams.set("travelmode", mode);
  return url.toString();
}
