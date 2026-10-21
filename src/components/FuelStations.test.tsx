import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FuelStations } from "./FuelStations";

afterEach(cleanup);
const origin = { lat: 40, lng: -3 };

describe("Gasolineras cercanas", () => {
  it("muestra kilómetros y minutos al pabellón y una ruta con origen y destino correctos", () => {
    render(<FuelStations origin={origin} status="success" error="" onLoad={vi.fn()} stations={[{
      id: "node-1", name: "Gasolinera Uno", address: "Calle Uno", lat: 40.001, lng: -3.002,
      sourceUrl: "https://www.openstreetmap.org/node/1", retrievedAt: "2026-10-19", coverage: "radius",
    }]} />);
    expect(screen.getByText("0,2 km al pabellón · ~1 min en coche")).toBeTruthy();
    const url = new URL(screen.getByRole("link", { name: "Ver ruta en coche a Gasolinera Uno" }).getAttribute("href")!);
    expect(url.searchParams.get("origin")).toBe("40,-3");
    expect(url.searchParams.get("destination")).toBe("40.001,-3.002");
    expect(screen.getByText(/minutos son una estimación orientativa/)).toBeTruthy();
  });
  it("ofrece una búsqueda externa cuando no hay datos", () => {
    render(<FuelStations origin={origin} status="success" error="" onLoad={vi.fn()} stations={[]} />);
    expect(screen.getByText(/No encontramos gasolineras/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buscar en Google Maps" }).getAttribute("href")).toContain("@40,-3,14z");
  });
  it("muestra las gasolineras guardadas del destino y el comparador de precios", () => {
    render(
      <FuelStations
        origin={origin}
        destination="Granollers"
        venueName="Pavelló Municipal del Congost"
        status="idle"
        error=""
        onLoad={vi.fn()}
        stations={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Gasolineras guardadas en Granollers" })).toBeTruthy();
    expect(screen.getByText("1PRIMER")).toBeTruthy();
    const locationLinks = screen.getAllByRole("link", { name: /^Ver ubicación de/ });
    expect(locationLinks).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Comparar precios/ }).getAttribute("href")).toBe(
      "https://www.ocu.org/coches/gasolina-y-carburantes/calculadora/gasolineras",
    );
    const map = new URL(locationLinks[0].getAttribute("href")!);
    expect(map.searchParams.get("query")).toContain("Shell, Carrer de Joanot Martorell");
  });
  it("permite consultar la lista guardada cuando el pabellón sigue pendiente", () => {
    render(
      <FuelStations
        origin={origin}
        destination="Madrid"
        venueName="Centro de Tecnificación de Madrid · Barajas"
        liveSearchAvailable={false}
        status="idle"
        error=""
        onLoad={vi.fn()}
        stations={[]}
      />,
    );
    expect(screen.getByText("Moeve")).toBeTruthy();
    expect(screen.getByText(/ubicación exacta de este pabellón sigue pendiente/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Buscar gasolineras" })).toBeNull();
  });
  it("muestra las opciones económicas de Tudela con precios fechados y ruta", () => {
    render(
      <FuelStations
        origin={{ lat: 41.5868, lng: -4.5862 }}
        destination="Tudela de Duero"
        venueName="Polideportivo San Roque"
        status="idle"
        error=""
        onLoad={vi.fn()}
        stations={[]}
      />,
    );
    expect(screen.getByText("AN Energéticos · Jaramiel")).toBeTruthy();
    expect(screen.getAllByText(/gasolina 95 1,695 €/).length).toBe(2);
    expect(screen.getAllByText(/Precio publicado 20\/10\/2026/).length).toBe(3);
    expect(screen.getAllByRole("link", { name: /^Ver ruta en coche a/ })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Ver fuente oficial" })).toHaveLength(3);
    expect(screen.getAllByText(/km al pabellón · ~\d+ min en coche/)).toHaveLength(3);
  });
});
