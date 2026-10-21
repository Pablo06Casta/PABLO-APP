import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamUtilitiesSection } from "./TeamUtilitiesSection";
import { defaultVenue, townForVenue } from "../data/venues";

const search = { town: townForVenue(defaultVenue), venue: defaultVenue, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 4 };
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Utilidades del viaje", () => {
  it("calcula el viaje y guarda los cambios", async () => {
    const user = userEvent.setup();
    render(<TeamUtilitiesSection search={search} />);
    const distance = screen.getByRole("textbox", { name: "Distancia de un trayecto (km)" });
    await user.type(distance, "100");
    await user.type(screen.getByRole("textbox", { name: "Consumo (l/100 km)" }), "6,5");
    await user.type(screen.getByRole("textbox", { name: "Precio combustible (€/l)" }), "1,70");
    expect(screen.getByText("200 km")).toBeTruthy();
    expect(screen.getByText("Por persona").parentElement?.textContent).toContain("5,52 €");
    expect(localStorage.getItem("cerca-team-utilities-v1")).toContain('"distanceKm":"100"');
  });

  it("permite repartir coches, controlar pagos y marcar material", async () => {
    const user = userEvent.setup();
    render(<TeamUtilitiesSection search={search} />);
    await user.click(screen.getByRole("button", { name: "Añadir coche" }));
    await user.type(screen.getByLabelText("Conductor"), "Pablo");
    await user.type(screen.getByLabelText("Pasajeros, separados por comas"), "Ana, Luis");
    expect(document.querySelector(".utility-summary")?.textContent).toContain("3 personas asignadas");
    await user.click(screen.getByRole("button", { name: "Añadir persona" }));
    await user.type(screen.getByLabelText("Importe del pago 1"), "20");
    expect(screen.getByText("Total").textContent).toContain("20,00 €");
    await user.click(screen.getByLabelText("Raquetas"));
    expect(screen.getByText("1 de 6 elementos preparados.")).toBeTruthy();
  });
});
