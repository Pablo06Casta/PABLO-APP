import type { Search, Stay } from "../types";
import { estimateStay } from "./estimates";

export const budgetCategories = [
  "Restaurante",
  "Comida",
  "Alojamiento",
  "Gasolina",
  "Transporte",
  "Otros",
] as const;
export type BudgetCategory = (typeof budgetCategories)[number];
export type BudgetScope = "group" | "person" | "personDay";
export type BudgetEntry = {
  id: string;
  category: BudgetCategory;
  concept: string;
  amount: string;
  scope: BudgetScope;
  days: string;
};
export type CalculatedEntry = BudgetEntry & { cents: number };

function parseCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:\d{1,7})(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents >= 0 && cents <= 100_000_000 ? cents : null;
}

export function calculateDetailedBudget({
  search,
  destination,
  peopleRaw,
  names,
  entries,
  stay,
}: {
  search: Search;
  destination: string;
  peopleRaw: string;
  names: string[];
  entries: BudgetEntry[];
  stay?: Stay;
}): { error: string; result: null } | {
  error: "";
  result: {
    destination: string;
    people: number;
    names: string[];
    entries: CalculatedEntry[];
    lodgingCents: number;
    totalCents: number;
    contributions: number[];
  };
} {
  const people = Number(peopleRaw);
  if (!/^\d+$/.test(peopleRaw) || !Number.isInteger(people) || people < 1 || people > 100)
    return { error: "Indica entre 1 y 100 viajeros.", result: null };
  const place = destination.trim();
  if (!place || place.length > 120) return { error: "Indica un destino de hasta 120 caracteres.", result: null };
  if (stay?.capacity != null && people > stay.capacity)
    return { error: "El grupo supera la capacidad publicada de ese alojamiento.", result: null };
  if (entries.length > 50) return { error: "Puedes añadir hasta 50 gastos.", result: null };
  const displayNames: string[] = [];
  for (let index = 0; index < people; index++) {
    const name = (names[index] ?? "").trim();
    if (name.length > 60) return { error: "Cada nombre puede tener hasta 60 caracteres.", result: null };
    displayNames.push(name || `Viajero ${index + 1}`);
  }
  const calculated: CalculatedEntry[] = [];
  for (const entry of entries) {
    const concept = entry.concept.trim();
    const cents = parseCents(entry.amount);
    const days = Number(entry.days);
    if (!budgetCategories.includes(entry.category) || !concept || concept.length > 100 || cents === null || !["group", "person", "personDay"].includes(entry.scope) || (entry.scope === "personDay" && (!/^\d+$/.test(entry.days) || !Number.isInteger(days) || days < 1 || days > 366)))
      return { error: "Revisa los conceptos, importes y días de los gastos. No se permiten importes negativos.", result: null };
    const total = cents * (entry.scope === "group" ? 1 : people) * (entry.scope === "personDay" ? days : 1);
    calculated.push({ ...entry, concept, cents: total });
  }
  const lodgingCents = stay ? estimateStay(stay, { ...search, guests: people }).totalGroup * 100 : 0;
  const totalCents = lodgingCents + calculated.reduce((sum, entry) => sum + entry.cents, 0);
  const share = Math.floor(totalCents / people);
  const remainder = totalCents % people;
  return {
    error: "",
    result: {
      destination: place,
      people,
      names: displayNames,
      entries: calculated,
      lodgingCents,
      totalCents,
      contributions: displayNames.map((_, index) => share + (index < remainder ? 1 : 0)),
    },
  };
}
