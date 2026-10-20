import { beforeEach, describe, expect, it } from "vitest";
import { defaultVenue, townForVenue } from "../data/venues";
import type { SavedBudget } from "./savedBudgets";
import {
  BUDGET_STORAGE_KEY,
  mergeBudgets,
  readLocalBudgets,
  removeBudget,
  upsertBudget,
} from "./savedBudgets";

const search = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: "2026-11-10",
  checkOut: "2026-11-13",
  guests: 2,
};

function budget(id: string, updatedAt: string, groupName = "Equipo CERCA"): SavedBudget {
  return {
    schemaVersion: 1,
    id,
    groupName,
    tournamentName: "TOP TTR",
    season: "2026/27",
    destination: "Vitoria-Gasteiz",
    peopleRaw: "2",
    names: ["Ana", "Luis"],
    entries: [],
    selectedStay: null,
    search,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt,
  };
}

describe("almacenamiento de presupuestos", () => {
  beforeEach(() => localStorage.clear());

  it("guarda, actualiza y elimina presupuestos locales", () => {
    const first = budget("7b4af85b-9e15-4e64-9e43-c228a362b6d6", "2026-10-20T10:00:00.000Z");
    const updated = { ...first, groupName: "Equipo actualizado", updatedAt: "2026-10-20T11:00:00.000Z" };
    upsertBudget([], first);
    upsertBudget(readLocalBudgets(), updated);
    expect(readLocalBudgets()).toEqual([updated]);
    expect(JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)!)).toHaveLength(1);
    removeBudget(readLocalBudgets(), first.id);
    expect(readLocalBudgets()).toEqual([]);
  });

  it("conserva la versión más reciente al unir dispositivo y nube", () => {
    const local = budget("7b4af85b-9e15-4e64-9e43-c228a362b6d6", "2026-10-20T10:00:00.000Z", "Local");
    const cloud = budget(local.id, "2026-10-20T12:00:00.000Z", "Nube");
    expect(mergeBudgets([local], [cloud])[0].groupName).toBe("Nube");
  });
});
