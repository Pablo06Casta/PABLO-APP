import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findMarkets,
  findFuelStations,
  fuelDirectionsUrl,
  findTown,
  reverseTown,
  parseMarkets,
  parseFuelStations,
  savedMarkets,
} from "./places";
import { venues, townForVenue } from "../data/venues";
import { distance } from "../lib/search";
afterEach(() => vi.unstubAllGlobals());
describe("Proveedores públicos de lugares", () => {
  it("busca gasolineras OSM reales y crea rutas desde el origen elegido", async () => {
    const origin = { id: "venue", name: "Sede", region: "España", lat: 40, lng: -3 };
    const request = vi.fn(async () => ({ ok: true, json: async () => ({ elements: [
      { type: "node", id: 1, lat: 40.002, lon: -3.001, tags: { amenity: "fuel", name: "Gasolinera Uno" } },
      { type: "node", id: 2, lat: 40.003, lon: -3.002, tags: { amenity: "restaurant", name: "No combustible" } },
    ] }) }));
    vi.stubGlobal("fetch", request);
    const result = await findFuelStations(origin, undefined, true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Gasolinera Uno");
    expect(String((request.mock.calls[0] as unknown[])[0])).toContain("overpass-api.de");
    const body = (request.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(String(body.body)).toContain("amenity");
    const url = new URL(fuelDirectionsUrl(origin, result[0]));
    expect(url.searchParams.get("origin")).toBe("40,-3");
    expect(url.searchParams.get("destination")).toBe("40.002,-3.001");
    expect(url.searchParams.get("travelmode")).toBe("driving");
    expect(parseFuelStations([{ type: "node", id: 3, lat: 91, lon: -3, tags: { amenity: "fuel" } }])).toEqual([]);
  });
  it("rechaza coordenadas inválidas y conserva un estado de error si OSM no responde", async () => {
    const bad = { lat: 99, lng: -3 };
    await expect(findFuelStations(bad)).rejects.toThrow("ubicación no es válida");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(findFuelStations({ lat: 42, lng: -4 }, undefined, true)).rejects.toThrow("OpenStreetMap no responde");
  });
  it("interpreta supermercados OSM de nodos y edificios sin inventar direcciones", async () => {
    const request = vi.fn(async (_input: RequestInfo | URL) => ({
      ok: true,
      json: async () => ({
        elements: [
          {
            type: "node",
            id: 123,
            lat: 37.17,
            lon: -3.59,
            tags: {
              shop: "supermarket",
              name: "Mercadona",
              "addr:street": "Calle Real",
              "addr:housenumber": "8",
              opening_hours: "Mo-Sa 09:00-21:30",
            },
          },
          {
            type: "way",
            id: 456,
            center: { lat: 37.18, lon: -3.6 },
            tags: { shop: "supermarket", brand: "Lidl" },
          },
          {
            type: "way",
            id: 789,
            tags: { shop: "supermarket", name: "Sin coordenadas" },
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", request);
    const markets = await findMarkets(
      {
        id: "test",
        name: "Granada",
        region: "Andalucía",
        lat: 37.17,
        lng: -3.59,
      },
      undefined,
      true,
    );
    expect(markets).toHaveLength(2);
    expect(markets[0]).toMatchObject({
      id: "node-123",
      name: "Mercadona",
      address: "Calle Real 8",
      source: "osm",
    });
    expect(markets[1].address).toBe("Dirección no disponible en OpenStreetMap");
    expect(String(request.mock.calls[0][0])).toContain("overpass-api.de");
  });
  it("propaga los fallos del proveedor y no crea resultados ficticios", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 })),
    );
    await expect(
      findMarkets({
        id: "other",
        name: "Madrid",
        region: "Madrid",
        lat: 40.416,
        lng: -3.703,
      }),
    ).rejects.toThrow("OpenStreetMap no responde");
  });
  it("consulta la API oficial al fallar Overpass y conserva la cobertura local", async () => {
    const request = vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes("overpass")
        ? { ok: false, status: 502 }
        : {
            ok: true,
            json: async () => ({
              elements: [
                { type: "node", id: 100, lat: 41.1, lon: -2.1 },
                { type: "node", id: 101, lat: 41.102, lon: -2.102 },
                {
                  type: "way",
                  id: 200,
                  nodes: [100, 101],
                  tags: { shop: "supermarket", name: "Tienda real" },
                },
              ],
            }),
          },
    );
    vi.stubGlobal("fetch", request);
    const result = await findMarkets({
      id: "fallback",
      name: "Prueba",
      region: "España",
      lat: 41.1,
      lng: -2.1,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Tienda real",
      lat: 41.101,
      lng: -2.101,
      coverage: "local",
    });
    expect(String(request.mock.calls[1][0])).toContain(
      "api.openstreetmap.org/api/0.6/map.json?bbox=",
    );
  });
  it("no transforma errores parciales de Overpass en cero supermercados y permite reconsultar vacíos", async () => {
    const request = vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () =>
        String(input).includes("overpass")
          ? { remark: "runtime timeout", elements: [] }
          : { elements: [] },
    }));
    vi.stubGlobal("fetch", request);
    const town = {
      id: "empty",
      name: "Prueba",
      region: "España",
      lat: 41.5,
      lng: -2.5,
    };
    expect(await findMarkets(town)).toEqual([]);
    expect(await findMarkets(town)).toEqual([]);
    expect(request).toHaveBeenCalledTimes(4);
  });
  it("respeta cancelación sin consultar proveedores alternativos", async () => {
    const controller = new AbortController();
    controller.abort();
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await expect(
      findMarkets(
        { id: "abort", name: "Prueba", region: "España", lat: 40, lng: -2 },
        controller.signal,
      ),
    ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
  it("descarta coordenadas corruptas y tiendas duplicadas", () => {
    const first = {
      type: "node",
      id: 300,
      lat: 40,
      lon: -3,
      tags: { shop: "supermarket", name: "Tienda" },
    };
    expect(
      parseMarkets([
        first,
        { ...first, id: 301 },
        { ...first, id: 302, lat: NaN },
      ]),
    ).toHaveLength(1);
  });
  it("no vuelve a incorporar comercios con una clasificación de supermercado revisada como inconsistente", () => {
    expect(
      parseMarkets([
        {
          type: "way",
          id: 115525107,
          center: { lat: 37.25858, lon: -6.92336 },
          tags: { shop: "supermarket", name: "MediaMarkt" },
        },
      ]),
    ).toEqual([]);
  });
  it("muestra supermercados reales y fechados para todas las sedes confirmadas sin depender de la red", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    for (const venue of venues.filter((item) => item.status === "confirmed")) {
      const origin = {
        ...townForVenue(venue),
        ...venue.location!,
        id: venue.id,
      };
      const shops = await findMarkets(origin);
      expect(shops.some((shop) => shop.kind === "supermarket")).toBe(true);
      expect(new Set(shops.map((shop) => shop.id)).size).toBe(shops.length);
      for (const shop of shops) {
        expect(distance(shop, venue.location!)).toBeLessThanOrEqual(3);
        expect(shop.source).toBe("osm");
        expect(shop.cached).toBe(true);
        expect(shop.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(shop.sourceUrl).toMatch(
          /^https:\/\/www.openstreetmap.org\/(node|way|relation)\/\d+$/,
        );
      }
    }
    expect(request).not.toHaveBeenCalled();
  });
  it("conserva los datos guardados si falla la actualización de una sede", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 })),
    );
    const venue = venues.find((item) => item.id === "estrada-coto")!;
    const origin = {
      ...townForVenue(venue),
      ...venue.location!,
      lat: venue.location!.lat + 0.00002,
    };
    const shops = await findMarkets(origin, undefined, true);
    expect(shops.map((shop) => shop.name)).toEqual(
      expect.arrayContaining(["Familia", "Mercadona", "Froiz"]),
    );
    expect(shops.every((shop) => shop.cached)).toBe(true);
    expect(shops.every((shop) => shop.retrievedAt === "2026-10-19")).toBe(true);
  });
  it("no borra los supermercados conocidos fuera de la pequeña ventana de actualización", async () => {
    const venue = venues.find((item) => item.id === "estrada-coto")!;
    const origin = {
      ...townForVenue(venue),
      ...venue.location!,
      lat: venue.location!.lat + 0.00004,
    };
    const saved = savedMarkets(origin),
      shop = saved[0];
    const [type, id] = shop.id.split("-");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes("overpass")
          ? { ok: false }
          : {
              ok: true,
              json: async () => ({
                elements: [
                  {
                    type,
                    id: Number(id),
                    center: { lat: shop.lat, lon: shop.lng },
                    tags: {
                      shop: shop.kind,
                      name: shop.name,
                      "addr:street": "Dirección actualizada",
                    },
                  },
                ],
              }),
            },
      ),
    );
    const result = await findMarkets(origin, undefined, true);
    expect(result.map((item) => item.id)).toEqual(
      expect.arrayContaining(saved.map((item) => item.id)),
    );
    expect(result.find((item) => item.id === shop.id)?.address).toBe(
      "Dirección actualizada",
    );
    expect(result.find((item) => item.id === shop.id)?.cached).not.toBe(true);
    expect(result.filter((item) => item.cached).length).toBeGreaterThan(0);
  });
  it("limita las búsquedas geográficas a España", async () => {
    const request = vi.fn(async (_input: RequestInfo | URL) => ({
      ok: true,
      json: async () => [
        {
          place_id: 9,
          lat: "37.8",
          lon: "-3.7",
          name: "Pueblo",
          address: { state: "Andalucía" },
        },
      ],
    }));
    vi.stubGlobal("fetch", request);
    const results = await findTown("Pueblo prueba única");
    expect(results[0]).toMatchObject({ name: "Pueblo", lat: 37.8, lng: -3.7 });
    const url = new URL(request.mock.calls[0][0] as unknown as string);
    expect(url.searchParams.get("countrycodes")).toBe("es");
  });
  it("rechaza la geolocalización fuera de España", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL) => ({
        ok: true,
        json: async () => ({ address: { country_code: "fr", city: "Paris" } }),
      })),
    );
    await expect(reverseTown(48.8, 2.3)).rejects.toThrow("localidad española");
  });
});
