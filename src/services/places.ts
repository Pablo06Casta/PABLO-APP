import type { Market, Town } from "../types";
const geocodeCache = new Map<string, Town[]>();
let lastGeocode = 0;
let geocodeQueue: Promise<void> = Promise.resolve();
// Solo se consulta Nominatim en acciones explícitas; el autocompletado es local.
// Una cola compartida limita las consultas de búsqueda y geolocalización a una por segundo.
async function geocodingRequest(url: URL, signal: AbortSignal) {
  const previous = geocodeQueue;
  let release!: () => void;
  geocodeQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    signal.throwIfAborted();
    const wait = Math.max(0, 1100 - (Date.now() - lastGeocode));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    signal.throwIfAborted();
    lastGeocode = Date.now();
    return await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    release();
  }
}
export async function findTown(
  query: string,
  signal?: AbortSignal,
): Promise<Town[]> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: query,
    countrycodes: "es",
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    "accept-language": "es",
    featureType: "settlement",
  }).toString();
  const response = await geocodingRequest(
    url,
    signal ?? AbortSignal.timeout(10000),
  );
  if (!response.ok)
    throw new Error(
      "No se pudo consultar el catálogo de localidades. Inténtalo más tarde.",
    );
  const data = (await response.json()) as Array<{
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
    address?: Record<string, string>;
  }>;
  const result = data
    .map((item) => ({
      id: String(item.place_id),
      name: item.name || item.display_name.split(",")[0],
      region: item.address?.state || item.address?.province || "España",
      lat: Number(item.lat),
      lng: Number(item.lon),
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  geocodeCache.set(query, result);
  return result;
}
export async function reverseTown(lat: number, lng: number): Promise<Town> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.search = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    zoom: "10",
    "accept-language": "es",
  }).toString();
  const response = await geocodingRequest(url, AbortSignal.timeout(10000));
  if (!response.ok) throw new Error("No se pudo identificar la localidad.");
  const data = (await response.json()) as {
    address?: Record<string, string>;
    lat?: string;
    lon?: string;
  };
  const address = data.address ?? {};
  if (address.country_code !== "es")
    throw new Error(
      "CERCA busca alojamientos en España. Elige una localidad española.",
    );
  return {
    id: `geo-${lat.toFixed(3)}-${lng.toFixed(3)}`,
    name:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "Mi ubicación",
    region: address.state || "España",
    lat: Number(data.lat ?? lat),
    lng: Number(data.lon ?? lng),
  };
}
const marketCache = new Map<string, { time: number; data: Market[] }>();
export async function findMarkets(
  town: Town,
  signal?: AbortSignal,
): Promise<Market[]> {
  const key = `${town.lat.toFixed(3)},${town.lng.toFixed(3)}`;
  const cached = marketCache.get(key);
  if (cached && Date.now() - cached.time < 3600000) return cached.data;
  const query = `[out:json][timeout:20];nwr["shop"~"^(supermarket|convenience)$"](around:6000,${town.lat},${town.lng});out center tags;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: query }),
    signal: signal ?? AbortSignal.timeout(25000),
  });
  if (!response.ok)
    throw new Error(
      "OpenStreetMap no responde en este momento. Puedes volver a intentarlo.",
    );
  const json = (await response.json()) as {
    elements: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
  const data = json.elements
    .map((item): Market | null => {
      const lat = item.lat ?? item.center?.lat;
      const lng = item.lon ?? item.center?.lon;
      if (lat === undefined || lng === undefined) return null;
      const tags = item.tags ?? {};
      const street = [tags["addr:street"], tags["addr:housenumber"]]
        .filter(Boolean)
        .join(" ");
      return {
        id: `${item.type}-${item.id}`,
        name: tags.name || tags.brand || "Supermercado local",
        address: street || "Dirección no disponible en OpenStreetMap",
        lat,
        lng,
        hours: tags.opening_hours,
        source: "osm",
      };
    })
    .filter((item): item is Market => item !== null);
  marketCache.set(key, { time: Date.now(), data });
  return data;
}
export const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
