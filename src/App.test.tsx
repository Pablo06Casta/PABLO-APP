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
import { makeTripUrl } from "./lib/trip";
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
import { findFuelStations, findMarkets, findTown } from "./services/places";

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
  findFuelStations: vi.fn(async () => [{
    id: "node-700", name: "Gasolinera registrada", address: "Calle de prueba",
    lat: 42.855, lng: -2.67, sourceUrl: "https://www.openstreetmap.org/node/700",
    retrievedAt: "2026-10-19", coverage: "radius",
  }]),
  fuelDirectionsUrl: (origin: {lat: number; lng: number}, station: {lat: number; lng: number}) =>
    `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${station.lat},${station.lng}&travelmode=driving`,
  mapsUrl: (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
}));
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
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
    expect(
      screen.getByRole("link", { name: "Comparar precios gasolina" }).getAttribute("href"),
    ).toBe(
      "https://www.ocu.org/coches/gasolina-y-carburantes/calculadora/gasolineras",
    );
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
    expect(localStorage.getItem("cerca-search-v3")).toBeNull();
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
    const favorite = within(screen.getAllByRole("article")[0]).getByRole(
      "button",
      { name: /^Guardar en favoritos:/ },
    );
    const stayName = favorite.getAttribute("aria-label")!.replace(
      "Guardar en favoritos: ",
      "",
    );
    await user.click(favorite);
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
          name: `Quitar de favoritos: ${stayName}`,
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
  it("recupera el enlace y permite presupuestar en una sección independiente", async () => {
    const chosen = realStays(query)[0];
    const url = makeTripUrl(window.location.href, query, [chosen]);
    window.history.replaceState({}, "", url);
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("1 de 3")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    await user.click(within(nav).getByRole("button", { name: "Presupuesto del grupo" }));
    const budget = screen.getByRole("region", { name: /Presupuesto del grupo/ });
    await user.selectOptions(within(budget).getByRole("combobox", { name: "Alojamiento estimado" }), chosen.id);
    await user.type(within(budget).getByRole("textbox", { name: "Viajero 1" }), "Ana");
    await user.click(within(budget).getByRole("button", { name: "Añadir gasto" }));
    await user.type(within(budget).getByRole("textbox", { name: "Nombre del gasto" }), "Cena del equipo");
    await user.type(within(budget).getByRole("textbox", { name: "Precio (€)" }), "45,50");
    expect(within(budget).getByText("Ana")).toBeTruthy();
    expect(within(budget).getByRole("button", { name: "Descargar presupuesto en PDF" }).hasAttribute("disabled")).toBe(false);
    await user.click(within(nav).getByRole("button", { name: "Alojamientos" }));
    await user.click(screen.getByRole("button", { name: "Compartir viaje" }));
    const dialog = screen.getByRole("dialog", { name: "Compartir viaje" });
    const link = (within(dialog).getByLabelText("Enlace del viaje") as HTMLInputElement).value;
    expect(link).toContain("trip=");
    expect(link).not.toContain("Ana");
    expect(link).not.toContain("Cena");
  });
  it("conserva el presupuesto al visitar otras secciones", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    await user.click(within(nav).getByRole("button", { name: "Presupuesto del grupo" }));
    await user.type(screen.getByRole("textbox", { name: "Viajero 1" }), "María");
    await user.click(within(nav).getByRole("button", { name: /Favoritos/ }));
    expect(screen.queryByRole("region", { name: /Presupuesto del grupo/ })).toBeNull();
    await user.click(within(nav).getByRole("button", { name: "Presupuesto del grupo" }));
    expect((screen.getByRole("textbox", { name: "Viajero 1" }) as HTMLInputElement).value).toBe("María");
  });
  it("guarda, duplica, abre y elimina presupuestos en el dispositivo", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    await user.click(within(nav).getByRole("button", { name: "Presupuesto del grupo" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del equipo o grupo" }), "Club Tudela");
    await user.type(screen.getByRole("textbox", { name: "Torneo" }), "TOP TTR");
    await user.type(screen.getByRole("textbox", { name: "Temporada" }), "2026/27");
    const library = screen.getByRole("region", { name: "Guarda y continúa después" });
    await user.click(within(library).getByRole("button", { name: "Guardar presupuesto" }));
    expect(JSON.parse(localStorage.getItem("cerca-saved-budgets-v1")!)).toHaveLength(1);
    expect(within(library).getByText("Club Tudela")).toBeTruthy();
    await user.click(within(library).getByRole("button", { name: "Duplicar" }));
    expect(JSON.parse(localStorage.getItem("cerca-saved-budgets-v1")!)).toHaveLength(2);
    expect((screen.getByRole("textbox", { name: "Nombre del equipo o grupo" }) as HTMLInputElement).value).toBe("Club Tudela (copia)");
    await user.click(within(library).getByRole("button", { name: "Nuevo" }));
    expect((screen.getByRole("textbox", { name: "Nombre del equipo o grupo" }) as HTMLInputElement).value).toBe("");
    await user.click(within(library).getAllByRole("button", { name: "Abrir" })[0]);
    expect((screen.getByRole("textbox", { name: "Torneo" }) as HTMLInputElement).value).toBe("TOP TTR");
    await user.click(within(library).getByRole("button", { name: "Eliminar Club Tudela (copia)" }));
    expect(JSON.parse(localStorage.getItem("cerca-saved-budgets-v1")!)).toHaveLength(1);
  });
  it("muestra la fuente y el enlace del hotel real con fechas y huéspedes", async () => {
    const user = userEvent.setup();
    render(<App />);
    const directLink = screen.getAllByRole("link", {
      name: /^Ver .+ en Booking$/,
    })[0];
    const directCard = directLink.closest("article")!;
    await user.click(
      within(directCard).getByRole("button", { name: /^Detalles de/ }),
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
    expect(url.hostname).toBe("www.booking.com");
    expect(url.searchParams.get("group_adults")).toBe("2");
    expect(url.searchParams.get("checkin")).toBe(query.checkIn);
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
      within(screen.getAllByRole("article")[0]).getByRole("button", {
        name: /^Guardar en favoritos:/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Abrir ajustes" }));
    await user.click(screen.getByRole("button", { name: "Oscuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.click(
      screen.getByRole("button", { name: "Gestionar datos guardados" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Borrar mis datos locales de CERCA" }),
    );
    expect(localStorage.getItem("cerca-favorites-v2")).toBeNull();
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
  it("busca gasolineras solo tras la acción del usuario y limita las sedes pendientes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Gasolineras cerca" }));
    expect(findFuelStations).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Buscar gasolineras" }));
    await screen.findByText("Gasolinera registrada");
    expect(vi.mocked(findFuelStations).mock.calls[0][0]).toMatchObject({ id: defaultVenue.id, ...defaultVenue.location });
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cerrar" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Tu pabellón de competición" }), "vitoria-aronova");
    await user.click(screen.getByRole("button", { name: "Gasolineras cerca" }));
    expect(within(screen.getByRole("dialog")).getByText(/ubicación exacta de este pabellón sigue pendiente/)).toBeTruthy();
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Buscar gasolineras" })).toBeNull();
    expect(vi.mocked(findFuelStations)).toHaveBeenCalledTimes(1);
  });
  it("filtra presupuesto y mantiene el orden de menor a mayor sin anuncios importados", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Consulta externa" }),
      "Booking",
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
    expect(cards.every((c) => c.dataset.platform === "Booking")).toBe(true);
  });
  it("solo recuerda búsquedas al activarlo y las elimina al retirar la opción", async () => {
    const user = userEvent.setup();
    let app = render(<App />);
    expect(localStorage.getItem("cerca-search-v3")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Privacidad y licencias" }),
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /Recordar mis búsquedas/,
    });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    await user.click(checkbox);
    expect(JSON.parse(localStorage.getItem("cerca-search-v3")!).town.id).toBe(
      query.town.id,
    );
    app.unmount();
    app = render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Privacidad y licencias" }),
    );
    expect(
      (
        screen.getByRole("checkbox", {
          name: /Recordar mis búsquedas/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (
        screen.getByRole("checkbox", {
          name: /fotos externas/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
    await user.click(
      screen.getByRole("checkbox", { name: /Recordar mis búsquedas/ }),
    );
    expect(localStorage.getItem("cerca-search-v3")).toBeNull();
    expect(localStorage.getItem("cerca-recent-v1")).toBeNull();
    expect(localStorage.getItem("cerca-remember-search-v1")).toBeNull();
  });
  it("retira anuncios Airbnb guardados por versiones anteriores sin borrar favoritos abiertos", () => {
    const hotel = realStays(query)[0];
    localStorage.setItem(
      "cerca-favorites-v2",
      JSON.stringify([
        { stay: hotel, town: query.town },
        {
          stay: { ...hotel, id: "airbnb-old", platform: "Airbnb" },
          town: query.town,
        },
      ]),
    );
    localStorage.setItem("cerca-search-v3", JSON.stringify(query));
    render(<App />);
    expect(
      JSON.parse(localStorage.getItem("cerca-favorites-v2")!).map(
        (entry: { stay: { id: string } }) => entry.stay.id,
      ),
    ).toEqual([hotel.id]);
    expect(localStorage.getItem("cerca-search-v3")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Buscar en Airbnb" })
        .getAttribute("href"),
    ).toMatch(/^https:\/\/www.airbnb.es\/s\//);
    expect(
      screen
        .getAllByRole("article")
        .every((card) => card.dataset.platform !== "Airbnb"),
    ).toBe(true);
  });
});
