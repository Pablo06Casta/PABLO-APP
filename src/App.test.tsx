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
  it("identifica la demo y no consulta ubicación ni APIs al cargar", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "¿Dónde quieres alojarte?",
    );
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getByText("Estás explorando una demo.")).toBeTruthy();
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
    expect(JSON.parse(localStorage.getItem("cerca-search-v1")!).town.name).toBe(
      "Málaga",
    );
    expect(findTown).not.toHaveBeenCalled();
  });
  it("filtra el presupuesto y recupera los resultados al restablecer", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog");
    const max = within(dialog).getByRole("spinbutton", { name: "Máximo (€)" });
    await user.clear(max);
    await user.type(max, "55");
    await user.click(
      within(dialog).getByRole("button", { name: "Aplicar filtros" }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });
  it("guarda favoritos, los muestra y los conserva al volver a abrir", async () => {
    const user = userEvent.setup();
    const app = render(<App />);
    await user.click(
      screen.getByRole("button", {
        name: "Guardar en favoritos: Un refugio lleno de luz",
      }),
    );
    const nav = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    await user.click(within(nav).getByRole("button", { name: /Favoritos/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem("cerca-favorites-v1")!),
    ).toHaveLength(1);
    app.unmount();
    render(<App />);
    expect(
      screen
        .getByRole("button", {
          name: "Quitar de favoritos: Un refugio lleno de luz",
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
  it("muestra el desglose y enlaces con las fechas y huéspedes seleccionados", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", {
        name: "Detalles de Un refugio lleno de luz",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Este alojamiento es ficticio."),
    ).toBeTruthy();
    expect(within(dialog).getByText("Total demo")).toBeTruthy();
    const url = new URL(
      (
        within(dialog).getByRole("link", {
          name: "Buscar en Booking",
        }) as HTMLAnchorElement
      ).href,
    );
    expect(url.searchParams.get("ss")).toContain("Granada");
    expect(url.searchParams.get("group_adults")).toBe("2");
    expect(url.searchParams.get("checkin")).toBe(
      JSON.parse(localStorage.getItem("cerca-search-v1")!).checkIn,
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
        name: "Guardar en favoritos: Un refugio lleno de luz",
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
      JSON.parse(localStorage.getItem("cerca-favorites-v1")!),
    ).toHaveLength(0);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
