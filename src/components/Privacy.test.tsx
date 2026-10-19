import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ExternalServices } from "./ExternalServices";
import { LazyMap } from "./LazyMap";
import { StayPhoto, PhotoCredit } from "./StayPhoto";
import { realStays } from "../services/lodging";
import { defaultVenue, townForVenue } from "../data/venues";
const search = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: "2027-03-27",
  checkOut: "2027-03-30",
  guests: 2,
};
const stay = {
  ...realStays(search)[0],
  images: ["https://upload.wikimedia.org/example.jpg"],
  photoCredit: {
    author: "Autora",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  },
};
vi.mock("./MapView", () => ({ MapView: () => <div>Mapa cargado</div> }));
afterEach(cleanup);
describe("Límite de carga de servicios externos", () => {
  it("no inserta imágenes remotas ni mapa antes de activarlos y permite retirarlos", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [photos, setPhotos] = useState(false),
        [maps, setMaps] = useState(false);
      return (
        <ExternalServices.Provider value={{ photos, setPhotos, maps, setMaps }}>
          <button onClick={() => setPhotos(!photos)}>Cambiar fotos</button>
          <button onClick={() => setMaps(false)}>Desactivar mapas</button>
          <StayPhoto stay={stay} />
          <PhotoCredit stay={stay} />
          <LazyMap
            stays={[stay]}
            search={search}
            markets={[]}
            onOpen={() => {}}
          />
        </ExternalServices.Provider>
      );
    }
    render(<Harness />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("Mapa cargado")).toBeNull();
    expect(
      screen.getByRole("link", { name: "CC BY-SA 4.0" }).getAttribute("href"),
    ).toBe(stay.photoCredit.licenceUrl);
    await user.click(screen.getByRole("button", { name: "Cambiar fotos" }));
    expect(screen.getByRole("img").getAttribute("src")).toBe(stay.images[0]);
    await user.click(
      screen.getByRole("button", { name: "Cargar mapa externo" }),
    );
    expect(await screen.findByText("Mapa cargado")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cambiar fotos" }));
    await user.click(screen.getByRole("button", { name: "Desactivar mapas" }));
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("Mapa cargado")).toBeNull();
  });
  it("conserva disponibles las fotos servidas por CERCA sin activar servicios externos", () => {
    render(<StayPhoto stay={{ ...stay, images: ["/stays/local.jpg"] }} />);
    expect(screen.getByRole("img").getAttribute("src")).toBe(
      "/stays/local.jpg",
    );
  });
});
