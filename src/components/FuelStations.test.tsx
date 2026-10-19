import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FuelStations } from "./FuelStations";

afterEach(cleanup);
const origin = { lat: 40, lng: -3 };

describe("Gasolineras cercanas", () => {
  it("muestra la distancia recta y una ruta en coche con origen y destino correctos", () => {
    render(<FuelStations origin={origin} status="success" error="" onLoad={vi.fn()} stations={[{
      id: "node-1", name: "Gasolinera Uno", address: "Calle Uno", lat: 40.001, lng: -3.002,
      sourceUrl: "https://www.openstreetmap.org/node/1", retrievedAt: "2026-10-19", coverage: "radius",
    }]} />);
    expect(screen.getAllByText(/en línea recta/).length).toBeGreaterThan(0);
    const url = new URL(screen.getByRole("link", { name: "Ver ruta en coche a Gasolinera Uno" }).getAttribute("href")!);
    expect(url.searchParams.get("origin")).toBe("40,-3");
    expect(url.searchParams.get("destination")).toBe("40.001,-3.002");
    expect(screen.getByText(/envían el origen y destino cuando los abres/)).toBeTruthy();
  });
  it("ofrece una búsqueda externa cuando no hay datos", () => {
    render(<FuelStations origin={origin} status="success" error="" onLoad={vi.fn()} stations={[]} />);
    expect(screen.getByText(/No encontramos gasolineras/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buscar en Google Maps" }).getAttribute("href")).toContain("@40,-3,14z");
  });
});
