import type { Search, Stay } from "../types";
import { estimateStay } from "./estimates";

export function groupBudget(search: Search, stay: Stay | undefined, transport: number, foodPerPersonDay: number, foodDays: number, other: number, people: number) {
  if (![transport, foodPerPersonDay, other].every((value) => Number.isFinite(value) && value >= 0 && value <= 1000000) || !Number.isInteger(foodDays) || foodDays < 0 || foodDays > 366 || !Number.isInteger(people) || people < 1 || people > 100 || (stay?.capacity != null && people > stay.capacity)) return null;
  const lodging = stay ? estimateStay(stay, { ...search, guests: people }).totalGroup : 0;
  const food = foodPerPersonDay * foodDays * people;
  const total = lodging + transport + food + other;
  return { lodging, transport, food, other, total, perPerson: total / people };
}
