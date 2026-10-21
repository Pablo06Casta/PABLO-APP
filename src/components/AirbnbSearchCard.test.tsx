import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { defaultVenue, townForVenue } from "../data/venues";
import { AirbnbSearchCard } from "./AirbnbSearchCard";

afterEach(cleanup);

describe("Búsqueda de Airbnb por destino", () => {
  it("conserva zona, fechas y viajeros del viaje", () => {
    const search = {
      town: townForVenue(defaultVenue), venue: defaultVenue,
      checkIn: "2026-11-06", checkOut: "2026-11-09", guests: 4,
    };
    render(<AirbnbSearchCard search={search} />);
    expect(screen.getByText("06/11/2026–09/11/2026 · 3 noches")).toBeTruthy();
    expect(screen.getByText("4 huéspedes")).toBeTruthy();
    const url = new URL(screen.getByRole("link", { name: /Ver alojamientos en Airbnb/ }).getAttribute("href")!);
    expect(url.hostname).toBe("www.airbnb.es");
    expect(url.searchParams.get("checkin")).toBe(search.checkIn);
    expect(url.searchParams.get("checkout")).toBe(search.checkOut);
    expect(url.searchParams.get("adults")).toBe("4");
    expect(url.searchParams.get("search_by_map")).toBe("true");
  });
});
