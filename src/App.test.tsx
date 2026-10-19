import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { realStays } from "./services/lodging";
import { defaultVenue, townForVenue, venues } from "./data/venues";
import { initialFilters, filterStays, isoDate } from "./lib/search";
const query = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: isoDate(7),
  checkOut: isoDate(10),
  guests: 2,
};
const count = filterStays(
  realStays(query),
  query,
  initialFilters,
  [],
  "distance",
).length;
import { findMarkets, findTown } from "./services/places";

vi.mock("./components/MapView", () => ({
  MapView: () => <div aria-label="Mapa de prueba" />,
}));
vi.mock("./services/places", () => ({
  findTown: vi.fn(async () => []),
  reverseTown: vi.fn(),
  findMarkets: vi.fn(async () => [
    {
      id: "real-osm-1",
      name: "Supermercado registrado",
      address: "Calle de prueba 1",
      lat: 37.176,
      lng: -3.598,
      source: "osm",
    },
  ]),
  mapsUrl: (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("CERCA: flujos del viajero", () => {
  it("muestra alojamientos reales y distingue enlaces directos de búsquedas sin geolocalizar al cargar", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Tu torneo, todo cerca.",
    );
    expect(screen.getAllByRole("article")).toHaveLength(count);
    expect(
      screen.getByText("Precios orientativos, alojamientos reales."),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", {
        name: /^(Ver|Buscar) .+ en (Booking|Airbnb)$/,
      }),
    ).toHaveLength(count);
    expect(
      screen.getAllByRole("link", { name: /^Buscar .+ en Booking$/ }).length,
    ).toBeGreaterThan(10);
    expect(
      screen.getByText(/alojamientos para buscar en Booking/),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Tu pabellón de competición" }),
    ).toBeTruthy();
    expect(findTown).not.toHaveBeenCalled();
    expect(findMarkets).not.toHaveBeenCalled();
  });
  it("autocompleta localidades y busca el destino elegido", async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByRole("combobox", { name: "Dónde" });
    await user.clear(field);
    await user.type(field, "Málaga");
    const town = screen.getByRole("option", { name: /^Málaga,/ });
    await user.click(within(town).getByRole("button"));
    await user.click(
      screen.getByRole("button", { name: "Buscar alojamientos" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Quédate en Málaga/ }),
      ).toBeTruthy(),
    );
    expect(JSON.parse(localStorage.getItem("cerca-search-v3")!).town.name).toBe(
      "Málaga",
    );
    expect(findTown).not.toHaveBeenCalled();
  });
  it("filtra la distancia y recupera los resultados al restablecer", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog");
    await user.selectOptions(
      within(dialog).getByRole("combobox", {
        name: "Distancia máxima al pabellón",
      }),
      "0.5",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Aplicar filtros" }),
    );
    expect(screen.getAllByRole("article").length).toBeLessThan(count);
    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getAllByRole("article")).toHaveLength(count);
  });
  it("guarda favoritos, los muestra y los conserva al volver a abrir", async () => {
    const user = userEvent.setup();
    const app = render(<App />);
    await user.click(
      screen.getByRole("button", {
        name: "Guardar en favoritos: NH Canciller Ayala Vitoria",
      }),
    );
    const nav = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    await user.click(within(nav).getByRole("button", { name: /Favoritos/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem("cerca-favorites-v2")!),
    ).toHaveLength(1);
    app.unmount();
    render(<App />);
    expect(
      screen
        .getByRole("button", {
          name: "Quitar de favoritos: NH Canciller Ayala Vitoria",
        })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("limita la comparación a tres alojamientos y permite abrirla", async () => {
    const user = userEvent.setup();
    render(<App />);
    const cards = screen.getAllByRole("article");
    for (const card of cards.slice(0, 4))
      await user.click(within(card).getByRole("button", { name: "Comparar" }));
    expect(screen.getByRole("status").textContent).toContain("hasta 3");
    expect(screen.getByText("3 de 3")).toBeTruthy();
    await user.click(
      screen.getAllByRole("button", { name: "Comparar" }).at(-1)!,
    );
    expect(
      screen.getByRole("dialog", { name: "¿Con cuál te quedas?" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Quitar" })).toHaveLength(3);
  });
  it("muestra la fuente y el enlace del hotel real con fechas y huéspedes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", {
        name: "Detalles de NH Canciller Ayala Vitoria",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Alojamiento real, presupuesto estimado."),
    ).toBeTruthy();
    expect(within(dialog).queryByText("Total demo")).toBeNull();
    expect(
      within(dialog).getByRole("link", { name: /Ver fuente/ }),
    ).toBeTruthy();
    const url = new URL(
      (
        within(dialog).getByRole("link", {
          name: "Ver este alojamiento en Booking",
        }) as HTMLAnchorElement
      ).href,
    );
    expect(url.searchParams.get("dest_id")).toBeTruthy();
    expect(url.searchParams.get("group_adults")).toBe("2");
    expect(url.searchParams.get("checkin")).toBe(
      JSON.parse(localStorage.getItem("cerca-search-v3")!).checkIn,
    );
  });
  it("consulta supermercados reales solo al solicitarlos", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Supermercados cerca" }),
    );
    await screen.findByText("Supermercado registrado");
    expect(findMarkets).toHaveBeenCalledTimes(1);
    expect(vi.mocked(findMarkets).mock.calls[0][0]).toMatchObject({
      id: defaultVenue.id,
      lat: defaultVenue.location!.lat,
      lng: defaultVenue.location!.lng,
    });
    expect(
      screen.getByRole("link", {
        name: "Cómo llegar a Supermercado registrado",
      }),
    ).toBeTruthy();
  });
  it("permite cambiar el tema y borrar los datos locales", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", {
        name: "Guardar en favoritos: NH Canciller Ayala Vitoria",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Abrir ajustes" }));
    await user.click(screen.getByRole("button", { name: "Oscuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.click(
      screen.getByRole("button", { name: "Gestionar datos guardados" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Borrar mis datos de CERCA" }),
    );
    expect(
      JSON.parse(localStorage.getItem("cerca-favorites-v2")!),
    ).toHaveLength(0);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("carga la compra desde el pabellón al abrir el detalle y conserva la lista si falla actualizar", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      within(screen.getAllByRole("article")[0]).getByRole("button", {
        name: /^Detalles de/,
      }),
    );
    await screen.findByText("Supermercado registrado");
    expect(vi.mocked(findMarkets).mock.calls[0][0]).toMatchObject({
      id: defaultVenue.id,
      ...defaultVenue.location,
    });
    vi.mocked(findMarkets).mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    await user.click(
      screen.getByRole("button", { name: "Actualizar supermercados" }),
    );
    await screen.findByText(
      /No se pudo actualizar. Puedes seguir usando los datos guardados/,
    );
    expect(screen.getByText("Supermercado registrado")).toBeTruthy();
  });
  it("no consulta comercios junto a una sede sin coordenadas confirmadas", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tu pabellón de competición" }),
      "vitoria-aronova",
    );
    await user.click(
      screen.getByRole("button", { name: "Supermercados cerca" }),
    );
    await screen.findByText(
      "Primero hay que confirmar la ubicación de este pabellón.",
    );
    expect(findMarkets).not.toHaveBeenCalled();
  });
  it("cambia de pabellón y consulta supermercados desde esa instalación", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tu pabellón de competición" }),
      "solares-mies",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Quédate en Solares/ }),
      ).toBeTruthy(),
    );
    await user.click(
      screen.getByRole("button", { name: "Supermercados cerca" }),
    );
    await screen.findByText("Supermercado registrado");
    const venue = venues.find((v) => v.id === "solares-mies")!;
    expect(vi.mocked(findMarkets).mock.calls.at(-1)![0]).toMatchObject({
      id: venue.id,
      ...venue.location,
    });
  });
  it("filtra Airbnb y presupuesto y mantiene el orden de menor a mayor", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Plataforma" }),
      "Airbnb",
    );
    const max = screen.getByRole("spinbutton", { name: "Máximo (€)" });
    await user.clear(max);
    await user.type(max, "45");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    const prices = cards.map((c) => Number(c.dataset.estimate));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices.every((p) => p <= 45)).toBe(true);
    expect(cards.every((c) => c.dataset.platform === "Airbnb")).toBe(true);
  });
});
