import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultVenue, townForVenue } from "../data/venues";
import type { Search } from "../types";
import { GroupBudgetSection } from "./GroupBudgetSection";

afterEach(cleanup);
const search: Search = { town: townForVenue(defaultVenue), venue: defaultVenue, checkIn: "2026-11-10", checkOut: "2026-11-13", guests: 2 };

describe("Presupuesto por viajero", () => {
  it("permite anotar 10 € para un viajero y 5 € para otro", async () => {
    const user = userEvent.setup();
    render(<GroupBudgetSection search={search} stays={[]} />);
    await user.type(screen.getByRole("textbox", { name: "Viajero 1" }), "Ana");
    await user.type(screen.getByRole("textbox", { name: "Viajero 2" }), "Luis");
    await user.click(screen.getByRole("button", { name: "Añadir gasto" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del gasto" }), "Cena");
    await user.selectOptions(screen.getByRole("combobox", { name: "Este precio es" }), "individual");
    const expense = screen.getByText("Gasto 1").closest(".budget-expense")! as HTMLElement;
    await user.type(within(expense).getByRole("textbox", { name: "Ana (€)" }), "10");
    await user.type(within(expense).getByRole("textbox", { name: "Luis (€)" }), "5");
    const summary = screen.getByRole("complementary", { name: "Resumen del viaje" });
    expect(summary.textContent).toContain("15,00 €");
    expect(summary.textContent).toContain("Ana");
    expect(summary.textContent).toContain("10,00 €");
    expect(summary.textContent).toContain("Luis");
    expect(summary.textContent).toContain("5,00 €");
    expect(screen.getByRole("button", { name: "Descargar presupuesto en PDF" }).hasAttribute("disabled")).toBe(false);
  });
});
