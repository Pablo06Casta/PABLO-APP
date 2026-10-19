import type { Market, Town } from "../types";
import catalogue from "../data/real/venue-markets.json";
import granadaMarkets from "../data/real/granada-markets.json";
import marketExclusions from "../data/real/market-exclusions.json";
import { distance } from "../lib/search";
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
type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  nodes?: number[];
  tags?: Record<string, string>;
};
const marketCache = new Map<string, { time: number; data: Market[] }>();
const excludedMarketIds = new Set(Object.keys(marketExclusions));
export function parseMarkets(elements: OsmElement[], local = false): Market[] {
  const nodes = new Map(
    elements.filter((e) => e.type === "node").map((e) => [e.id, e]),
  );
  const result: Market[] = [];
  for (const item of elements) {
    const tags = item.tags ?? {};
    if (tags.shop !== "supermarket" && tags.shop !== "convenience") continue;
    if (excludedMarketIds.has(`${item.type}-${item.id}`)) continue;
    let lat = item.lat ?? item.center?.lat,
      lng = item.lon ?? item.center?.lon;
    if (lat === undefined && item.nodes?.length) {
      const points = item.nodes
        .map((id) => nodes.get(id))
        .filter(
          (p): p is OsmElement & { lat: number; lon: number } =>
            p?.lat !== undefined && p?.lon !== undefined,
        );
      if (points.length) {
        lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
        lng = points.reduce((sum, p) => sum + p.lon, 0) / points.length;
      }
    }
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat!) > 90 ||
      Math.abs(lng!) > 180
    )
      continue;
    const market: Market = {
      id: `${item.type}-${item.id}`,
      name: tags.name || tags.brand || "Tienda de alimentación",
      address:
        [tags["addr:street"], tags["addr:housenumber"]]
          .filter(Boolean)
          .join(" ") || "Dirección no disponible en OpenStreetMap",
      lat: lat!,
      lng: lng!,
      hours: tags.opening_hours,
      source: "osm",
      sourceUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      kind: tags.shop,
      retrievedAt: new Date().toISOString().slice(0, 10),
      coverage: local ? "local" : "radius",
    };
    if (
      !result.some(
        (m) =>
          m.name.toLowerCase() === market.name.toLowerCase() &&
          Math.abs(m.lat - market.lat) < 0.0003 &&
          Math.abs(m.lng - market.lng) < 0.0003,
      )
    )
      result.push(market);
  }
  return result;
}

// Saved public OSM facts make the venue searches work offline and during outages.
// They retain their real retrieval date and never claim live opening/availability.
export function savedMarkets(origin: Pick<Town, "lat" | "lng">): Market[] {
  return ([...catalogue.markets, ...granadaMarkets] as Market[])
    .filter((market) => distance(origin, market) <= 3)
    .map((market) => ({ ...market, cached: true }))
    .sort((a, b) => distance(origin, a) - distance(origin, b));
}

function combineMarkets(
  origin: Pick<Town, "lat" | "lng">,
  saved: Market[],
  live: Market[],
): Market[] {
  // A small local response cannot invalidate shops outside its queried window.
  const combined = new Map(saved.map((market) => [market.id, market]));
  for (const market of live) combined.set(market.id, market);
  return [...combined.values()]
    .filter((market) => distance(origin, market) <= 3)
    .filter(
      (market, index, all) =>
        !all
          .slice(0, index)
          .some(
            (other) =>
              other.name.toLocaleLowerCase("es") ===
                market.name.toLocaleLowerCase("es") &&
              distance(other, market) < 0.035,
          ),
    )
    .sort((a, b) => distance(origin, a) - distance(origin, b));
}

export async function findMarkets(
  town: Town,
  signal: AbortSignal = AbortSignal.timeout(22000),
  refresh = false,
): Promise<Market[]> {
  signal.throwIfAborted();
  if (
    !Number.isFinite(town.lat) ||
    !Number.isFinite(town.lng) ||
    Math.abs(town.lat) > 90 ||
    Math.abs(town.lng) > 180
  )
    throw new Error("La ubicación no es válida para buscar supermercados.");
  const key = `${town.lat.toFixed(5)},${town.lng.toFixed(5)}`;
  const cached = marketCache.get(key);
  if (!refresh && cached && Date.now() - cached.time < 3600000)
    return cached.data;
  const stored = combineMarkets(
    town,
    savedMarkets(town),
    cached?.data.map((market) => ({ ...market, cached: true })) ?? [],
  );
  if (!refresh && stored.length) return stored;
  const query = `[out:json][timeout:5];nwr["shop"~"^(supermarket|convenience)$"](around:3000,${town.lat},${town.lng});out center tags;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
    });
    if (!response.ok) throw new Error("Overpass unavailable");
    const json = await response.json();
    if (json.remark || !Array.isArray(json.elements))
      throw new Error("Incomplete response");
    const data = combineMarkets(town, [], parseMarkets(json.elements));
    if (!data.length && stored.length) return stored;
    if (data.length) marketCache.set(key, { time: Date.now(), data });
    return data;
  } catch {
    signal.throwIfAborted();
  }
  // Fallback oficial de lectura, en una ventana pequeña para no descargar ciudades.
  // Si supera el límite de nodos, reducimos el área una sola vez.
  for (const delta of [0.006, 0.003]) {
    try {
      const bbox = [
        town.lng - delta,
        town.lat - delta,
        town.lng + delta,
        town.lat + delta,
      ].join(",");
      const response = await fetch(
        `https://api.openstreetmap.org/api/0.6/map.json?bbox=${bbox}`,
        {
          signal: AbortSignal.any([signal, AbortSignal.timeout(7500)]),
        },
      );
      if (!response.ok) throw new Error("OSM unavailable");
      const json = await response.json();
      if (!Array.isArray(json.elements))
        throw new Error("Invalid OSM response");
      const live = parseMarkets(json.elements, true);
      const data = combineMarkets(town, stored, live);
      if (live.length && data.length)
        marketCache.set(key, { time: Date.now(), data });
      return data;
    } catch {
      signal.throwIfAborted();
    }
  }
  signal.throwIfAborted();
  if (stored.length) return stored;
  throw new Error(
    "OpenStreetMap no responde en este momento. Puedes volver a intentarlo.",
  );
}
export const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
