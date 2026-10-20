import { describe, expect, it } from "vitest";
import { defaultVenue, townForVenue } from "../data/venues";
import { realStays } from "../services/lodging";
import { calculateDetailedBudget, type BudgetEntry } from "./detailedBudget";
import type { Search } from "../types";

const search: Search = { town: townForVenue(defaultVenue), venue: defaultVenue, checkIn: "2026-11-10", checkOut: "2026-11-13", guests: 3 };
const entries: BudgetEntry[] = [
  { id: "1", category: "Restaurante", concept: "Cena", amount: "10,01", scope: "group", days: "1" },
  { id: "2", category: "Comida", concept: "Menú", amount: "7,50", scope: "personDay", days: "2" },
  { id: "3", category: "Gasolina", concept: "Depósito", amount: "30", scope: "group", days: "1" },
];
const input = { search, groupName: "Equipo CERCA", destination: "Vitoria-Gasteiz", peopleRaw: "3", names: ["Ana", "", "Luis"], entries };

describe("presupuesto completo del grupo", () => {
  it("calcula gastos por grupo, persona y día y reparte todos los céntimos", () => {
    const { result } = calculateDetailedBudget(input);
    expect(result).not.toBeNull();
    expect(result!.groupName).toBe("Equipo CERCA");
    expect(result!.entries.map((entry) => entry.cents)).toEqual([1001, 4500, 3000]);
    expect(result!.names).toEqual(["Ana", "Viajero 2", "Luis"]);
    expect(result!.totalCents).toBe(8501);
    expect(result!.contributions).toEqual([2834, 2834, 2833]);
    expect(result!.contributions.reduce((sum, value) => sum + value, 0)).toBe(result!.totalCents);
  });
  it("añade solo el alojamiento elegido de la comparación", () => {
    const stay = realStays(search)[0];
    const { result } = calculateDetailedBudget({ ...input, stay });
    expect(result!.lodgingCents).toBeGreaterThan(0);
    expect(result!.totalCents).toBe(8501 + result!.lodgingCents);
  });
  it("asigna gastos distintos a personas concretas sin repartirlos entre todos", () => {
    const personal: BudgetEntry = {
      id: "4", category: "Comida", concept: "Merienda", amount: "",
      scope: "individual", days: "1", individualAmounts: ["10", "5", ""],
    };
    const { result } = calculateDetailedBudget({ ...input, entries: [...entries, personal] });
    expect(result!.entries.at(-1)?.individualCents).toEqual([1000, 500, 0]);
    expect(result!.entries.at(-1)?.cents).toBe(1500);
    expect(result!.individualTotals).toEqual([1000, 500, 0]);
    expect(result!.contributions).toEqual([3834, 3334, 2833]);
    expect(result!.contributions.reduce((sum, amount) => sum + amount, 0)).toBe(result!.totalCents);
    expect(calculateDetailedBudget({ ...input, entries: [{ ...personal, individualAmounts: ["-10", "5"] }] }).result).toBeNull();
  });
  it("valida viajeros, precios, días, conceptos y capacidad", () => {
    expect(calculateDetailedBudget({ ...input, peopleRaw: "0" }).result).toBeNull();
    expect(calculateDetailedBudget({ ...input, entries: [{ ...entries[0], amount: "-1" }] }).result).toBeNull();
    expect(calculateDetailedBudget({ ...input, entries: [{ ...entries[1], days: "0" }] }).result).toBeNull();
    expect(calculateDetailedBudget({ ...input, entries: [{ ...entries[0], concept: "" }] }).result).toBeNull();
    expect(calculateDetailedBudget({ ...input, groupName: "A".repeat(101) }).result).toBeNull();
  });
});
