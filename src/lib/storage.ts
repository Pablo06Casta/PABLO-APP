import { useState } from "react";
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));
  const update = (next: T | ((previous: T) => T)) => {
    setValue((previous) => {
      const result =
        typeof next === "function" ? (next as (p: T) => T)(previous) : next;
      try {
        localStorage.setItem(key, JSON.stringify(result));
      } catch {
        /* El almacenamiento puede estar deshabilitado. */
      }
      return result;
    });
  };
  return [value, update] as const;
}
