import { afterEach, describe, expect, it, vi } from "vitest";
import { findMarkets, findTown, reverseTown } from "./places";
afterEach(() => vi.unstubAllGlobals());
describe("Proveedores públicos de lugares", () => {
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
            tags: { brand: "Lidl" },
          },
          { type: "way", id: 789, tags: { name: "Sin coordenadas" } },
        ],
      }),
    }));
    vi.stubGlobal("fetch", request);
    const markets = await findMarkets({
      id: "test",
      name: "Granada",
      region: "Andalucía",
      lat: 37.17,
      lng: -3.59,
    });
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
