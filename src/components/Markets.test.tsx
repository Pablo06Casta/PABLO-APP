import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Markets } from "./Markets";
import type { Market } from "../types";

const origin = {
  id: "venue",
  name: "Pabellón",
  region: "España",
  lat: 42,
  lng: -3,
};
const shops: Market[] = [
  {
    id: "node-101",
    name: "Supermercado de prueba",
    lat: 42.001,
    lng: -3,
    kind: "supermarket",
    address: "Dirección de prueba",
    source: "osm",
    sourceUrl: "https://www.openstreetmap.org/node/101",
    cached: true,
    retrievedAt: "2026-10-19",
    coverage: "local",
  },
  {
    id: "node-102",
    name: "Tienda de prueba",
    lat: 42.0001,
    lng: -3,
    kind: "convenience",
    address: "Dirección de prueba",
    source: "osm",
    cached: true,
    retrievedAt: "2026-10-18",
    coverage: "local",
  },
];
afterEach(cleanup);
describe("Lista de supermercados", () => {
  it("separa supermercados de tiendas y mantiene origen y fechas en enlaces y atribución", async () => {
    const user = userEvent.setup();
    render(
      <Markets
        markets={shops}
        origin={origin}
        status="success"
        error=""
        onLoad={vi.fn()}
      />,
    );
    expect(screen.getByText("Supermercado de prueba")).toBeTruthy();
    expect(screen.queryByText("Tienda de prueba")).toBeNull();
    const href = screen
      .getByRole("link", { name: "Cómo llegar a Supermercado de prueba" })
      .getAttribute("href")!;
    expect(new URL(href).searchParams.get("destination")).toBe("42.001,-3");
    expect(
      screen
        .getByRole("link", { name: "Ver en OpenStreetMap" })
        .getAttribute("href"),
    ).toBe("https://www.openstreetmap.org/node/101");
    expect(
      screen.getByText(/Incluye datos guardados de 2026-10-18 a 2026-10-19/),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Incluir tiendas de alimentación" }),
    );
    expect(
      screen
        .getAllByRole("heading", { level: 4 })
        .map((node) => node.textContent),
    ).toEqual(["Tienda de prueba", "Supermercado de prueba"]);
  });
  it("conserva la lista visible durante la actualización y muestra el aviso sin perderla", () => {
    const { rerender } = render(
      <Markets
        markets={shops}
        origin={origin}
        status="loading"
        error=""
        onLoad={vi.fn()}
      />,
    );
    expect(screen.getByText("Supermercado de prueba")).toBeTruthy();
    expect(
      screen.getByText(/puedes seguir consultando la lista guardada/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Actualizar supermercados" })
        .hasAttribute("disabled"),
    ).toBe(true);
    rerender(
      <Markets
        markets={shops}
        origin={origin}
        status="success"
        error="No se pudo actualizar"
        onLoad={vi.fn()}
      />,
    );
    expect(screen.getByText("Supermercado de prueba")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "No se pudo actualizar",
    );
  });
});
