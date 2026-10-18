import type { Filters, Market, Search, Stay } from "../types";
export const initialFilters: Filters = {
  minPrice: 0,
  maxPrice: 150,
  maxDistance: 5,
  type: "Todos",
  minRating: 0,
  cancellation: false,
  parking: false,
  kitchen: false,
  marketDistance: 0,
};
export const money = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
export function isoDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function nights(search: Pick<Search, "checkIn" | "checkOut">) {
  return Math.max(
    1,
    Math.round(
      (Date.parse(search.checkOut) - Date.parse(search.checkIn)) / 86400000,
    ),
  );
}
export const totalPrice = (stay: Stay, search: Search) =>
  stay.nightly === null || stay.cleaningFee === null
    ? null
    : stay.nightly * nights(search) + stay.cleaningFee;
export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const rad = Math.PI / 180;
  const dlat = (b.lat - a.lat) * rad;
  const dlng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export const formatDistance = (km: number) =>
  km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km.toFixed(1).replace(".", ",")} km`;
export function nearestMarkets(
  stay: { lat: number; lng: number },
  markets: Market[],
) {
  return markets
    .map((market) => ({ ...market, distance: distance(stay, market) }))
    .sort((a, b) => a.distance - b.distance);
}
export function filterStays(
  stays: Stay[],
  search: Search,
  filters: Filters,
  markets: Market[],
  sort: string,
) {
  const selected = stays.filter(
    (stay) =>
      (stay.nightly === null
        ? filters.minPrice === initialFilters.minPrice &&
          filters.maxPrice === initialFilters.maxPrice
        : stay.nightly >= filters.minPrice &&
          stay.nightly <= filters.maxPrice) &&
      distance(stay, search.town) <= filters.maxDistance &&
      (stay.capacity === null || stay.capacity >= search.guests) &&
      (filters.type === "Todos" || stay.type === filters.type) &&
      (!filters.minRating ||
        (stay.rating !== null && stay.rating >= filters.minRating)) &&
      (!filters.cancellation || stay.freeCancellation) &&
      (!filters.parking || stay.amenities.includes("Aparcamiento")) &&
      (!filters.kitchen || stay.amenities.includes("Cocina")) &&
      (!filters.marketDistance ||
        nearestMarkets(stay, markets).some(
          (market) => market.distance <= filters.marketDistance,
        )),
  );
  return selected.sort((a, b) =>
    sort === "recommended"
      ? Number(Boolean(b.images.length)) - Number(Boolean(a.images.length)) ||
        distance(a, search.town) - distance(b, search.town)
      : sort === "distance"
        ? distance(a, search.town) - distance(b, search.town)
        : sort === "rating"
          ? (b.rating ?? -1) - (a.rating ?? -1)
          : sort === "name"
            ? a.name.localeCompare(b.name, "es")
            : (totalPrice(a, search) ?? Infinity) -
              (totalPrice(b, search) ?? Infinity),
  );
}
export function stayBookingUrl(stay: Stay, search: Search) {
  // Las rutas conocidas abren la ficha; los IDs numéricos seleccionan ese hotel.
  const url = stay.bookingPath
    ? new URL(`https://www.booking.com/hotel/${stay.bookingPath}.html`)
    : new URL("https://www.booking.com/searchresults.es.html");
  if (!stay.bookingPath) {
    if (!stay.bookingId || !/^\d+$/.test(stay.bookingId)) return undefined;
    url.searchParams.set("dest_type", "hotel");
    url.searchParams.set("dest_id", stay.bookingId);
    url.searchParams.set("highlighted_hotels", stay.bookingId);
    url.searchParams.set("ss", stay.name);
  }
  url.searchParams.set("checkin", search.checkIn);
  url.searchParams.set("checkout", search.checkOut);
  url.searchParams.set("group_adults", String(search.guests));
  url.searchParams.set("no_rooms", "1");
  url.searchParams.set("group_children", "0");
  return url.href;
}
export function bookingUrl(search: Search, platform: "Booking" | "Airbnb") {
  if (platform === "Airbnb") {
    const url = new URL(
      `https://www.airbnb.es/s/${encodeURIComponent(search.town.name + "--España")}/homes`,
    );
    url.searchParams.set("checkin", search.checkIn);
    url.searchParams.set("checkout", search.checkOut);
    url.searchParams.set("adults", String(search.guests));
    return url.href;
  }
  const url = new URL("https://www.booking.com/searchresults.es.html");
  url.searchParams.set("ss", search.town.name + ", España");
  url.searchParams.set("checkin", search.checkIn);
  url.searchParams.set("checkout", search.checkOut);
  url.searchParams.set("group_adults", String(search.guests));
  url.searchParams.set("no_rooms", "1");
  url.searchParams.set("group_children", "0");
  return url.href;
}
