import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TournamentCalendar } from "./TournamentCalendar";
import { defaultVenue, townForVenue } from "../data/venues";
import type { Tournament } from "../data/tournaments";
const search = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: "2026-10-26",
  checkOut: "2026-10-29",
  guests: 2,
};
const examples: Tournament[] = [
  {
    id: "88232",
    name: "Campeonatos de España Sub-17",
    startDate: "2026-11-06",
    endDate: "2026-11-08",
    city: "Granollers",
    destination: "Granollers",
    group: "Ctos. España",
    category: "Sub-17",
    sourceUrl:
      "https://www.badminton.es/calendarevent/88232/Campeonatos-de-Espana-Sub17",
  },
  {
    id: "88237",
    name: "Spanish International U17 2026",
    startDate: "2026-11-13",
    endDate: "2026-11-15",
    city: "Ibiza",
    destination: "Ibiza",
    group: "Sub-17",
    category: "U17 Int. Series",
    sourceUrl:
      "https://www.badminton.es/calendarevent/88237/Spanish-International-U17-2026",
  },
];
afterEach(cleanup);
describe("Calendario de torneos", () => {
  it("filtra competiciones y exige elegir pabellón antes de planear alojamiento", async () => {
    const user = userEvent.setup();
    const onPlan = vi.fn();
    render(
      <TournamentCalendar
        search={search}
        onPlan={onPlan}
        today="2026-10-19"
        events={examples}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Próximos torneos" }),
    ).toBeTruthy();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Ciudad" }),
      "Granollers",
    );
    expect(screen.getByRole("button", { name: "Mes siguiente" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(screen.getByRole("heading", { name: "Noviembre de 2026" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /6 nov 2026: 1 torneo/ }));
    const card = screen
      .getByRole("heading", { name: "Campeonatos de España Sub-17" })
      .closest("article")!;
    expect(
      within(card)
        .getByRole("link", { name: /Ver ficha en badminton.es/ })
        .getAttribute("href"),
    ).toMatch(/88232/);
    const plan = within(card).getByRole("button", {
      name: /Buscar alojamiento/,
    });
    expect((plan as HTMLButtonElement).disabled).toBe(true);
    await user.selectOptions(
      within(card).getByRole("combobox", { name: "Pabellón para tu búsqueda" }),
      "granollers-congost",
    );
    expect((plan as HTMLButtonElement).disabled).toBe(false);
    await user.click(plan);
    expect(onPlan).toHaveBeenCalledOnce();
    expect(onPlan.mock.calls[0][0]).toMatchObject({
      id: "88232",
      startDate: "2026-11-06",
      endDate: "2026-11-08",
    });
    expect(onPlan.mock.calls[0][1]).toMatchObject({ id: "granollers-congost" });
  });
  it("no ofrece búsqueda cercana para un torneo cuya sede CERCA está pendiente", async () => {
    const user = userEvent.setup();
    render(
      <TournamentCalendar
        search={search}
        onPlan={() => {}}
        today="2026-10-19"
        events={examples}
      />,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Ciudad" }),
      "Ibiza",
    );
    await user.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(
      screen.getAllByText(/todavía no tiene un pabellón confirmado/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /Buscar alojamiento/ }),
    ).toBeNull();
  });
  it("permite cambiar entre calendario y lista y marca todos los días de un torneo", async () => {
    const user = userEvent.setup();
    render(<TournamentCalendar search={search} onPlan={() => {}} today="2026-10-19" events={examples} />);
    await user.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(screen.getByRole("button", { name: /7 nov 2026: 1 torneo/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /8 nov 2026: 1 torneo/ }));
    expect(screen.getByRole("heading", { name: "Torneos del 8 nov 2026" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Campeonatos de España Sub-17" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Lista" }));
    expect(screen.getByRole("combobox", { name: "Mes" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "Campeonatos de España Sub-17" })).toHaveLength(1);
  });
});
