import type { Stay, Search } from "../types";
import type { BudgetEntry } from "./detailedBudget";
import { supabase } from "./supabase";

export const BUDGET_STORAGE_KEY = "cerca-saved-budgets-v1";
export const MAX_SAVED_BUDGETS = 50;

export type SavedBudget = {
  schemaVersion: 1;
  id: string;
  groupName: string;
  tournamentName: string;
  season: string;
  destination: string;
  peopleRaw: string;
  names: string[];
  entries: BudgetEntry[];
  selectedStay: Stay | null;
  search: Search;
  createdAt: string;
  updatedAt: string;
};

type BudgetRow = {
  id: string;
  payload: SavedBudget;
  created_at: string;
  updated_at: string;
};

function validBudget(value: unknown): value is SavedBudget {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedBudget>;
  return item.schemaVersion === 1 &&
    typeof item.id === "string" &&
    typeof item.groupName === "string" &&
    typeof item.tournamentName === "string" &&
    typeof item.season === "string" &&
    typeof item.destination === "string" &&
    typeof item.peopleRaw === "string" &&
    Array.isArray(item.names) &&
    Array.isArray(item.entries) &&
    Boolean(item.search?.town) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string";
}

export function readLocalBudgets(): SavedBudget[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(validBudget).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_SAVED_BUDGETS)
      : [];
  } catch {
    return [];
  }
}

export function writeLocalBudgets(budgets: SavedBudget[]) {
  const next = [...budgets]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_SAVED_BUDGETS);
  try {
    if (next.length) localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(BUDGET_STORAGE_KEY);
  } catch {
    /* El almacenamiento del navegador es opcional. */
  }
  return next;
}

export function upsertBudget(budgets: SavedBudget[], budget: SavedBudget) {
  return writeLocalBudgets([budget, ...budgets.filter((item) => item.id !== budget.id)]);
}

export function removeBudget(budgets: SavedBudget[], id: string) {
  return writeLocalBudgets(budgets.filter((item) => item.id !== id));
}

export function mergeBudgets(local: SavedBudget[], cloud: SavedBudget[]) {
  const merged = new Map<string, SavedBudget>();
  for (const budget of [...local, ...cloud]) {
    const previous = merged.get(budget.id);
    if (!previous || budget.updatedAt > previous.updatedAt) merged.set(budget.id, budget);
  }
  return writeLocalBudgets([...merged.values()]);
}

export function createBudgetId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const values = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = values.map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function readCloudBudgets(): Promise<SavedBudget[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("budgets")
    .select("id,payload,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_SAVED_BUDGETS);
  if (error) throw error;
  return ((data ?? []) as BudgetRow[]).flatMap((row) => {
    const candidate = {
      ...row.payload,
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return validBudget(candidate) ? [candidate] : [];
  });
}

export async function saveCloudBudget(budget: SavedBudget, userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from("budgets").upsert({
    id: budget.id,
    user_id: userId,
    name: budget.groupName.trim() || "Presupuesto sin nombre",
    destination: budget.destination,
    payload: budget,
    created_at: budget.createdAt,
    updated_at: budget.updatedAt,
  });
  if (error) throw error;
}

export async function deleteCloudBudget(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

