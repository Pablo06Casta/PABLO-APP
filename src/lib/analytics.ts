import { useSyncExternalStore } from "react";

// Analítica de uso mínima y sin cookies:
// - Solo se envía tras el consentimiento expreso de la persona (opt-in).
// - Cada evento contiene únicamente un nombre y un identificador público
//   (sección, sede o función). No hay identificadores de usuario, de sesión,
//   huellas del navegador, URL, referer ni agente de usuario.
// - En el dispositivo solo se guarda la elección de consentimiento.
export type AnalyticsConsent = "granted" | "denied" | "unset";
export type AnalyticsEvent =
  | "section"
  | "destination"
  | "feature"
  | "tournament_plan";

export const consentKey = "cerca-analytics-consent-v1";
const listeners = new Set<() => void>();
const sent = new Set<string>();
let consent: AnalyticsConsent = readConsent();

function readConsent(): AnalyticsConsent {
  try {
    const value = localStorage.getItem(consentKey);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

// Desactivada por defecto: requiere VITE_ANALYTICS=on y la tabla
// usage_events creada en Supabase. Sin ello no hay aviso ni envíos.
function endpoint() {
  if (import.meta.env.VITE_ANALYTICS?.trim() !== "on") return null;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return url && key ? { url: `${url}/rest/v1/usage_events`, key } : null;
}

export function analyticsAvailable() {
  return endpoint() !== null;
}

function privacySignal() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

export function getConsent() {
  return consent;
}

export function setConsent(value: AnalyticsConsent) {
  consent = value;
  try {
    if (value === "unset") localStorage.removeItem(consentKey);
    else localStorage.setItem(consentKey, value);
  } catch {
    /* Sin almacenamiento la elección dura lo que dure la visita. */
  }
  if (value !== "granted") sent.clear();
  listeners.forEach((listener) => listener());
}

export function useAnalyticsConsent() {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getConsent,
    getConsent,
  );
  return [value, setConsent] as const;
}

export function sanitizeDetail(detail: string) {
  return detail
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

// Cada combinación se cuenta una vez por visita: permite saber cuántas visitas
// usan un destino o una función sin seguir a nadie entre visitas.
export function track(event: AnalyticsEvent, detail = "") {
  const target = endpoint();
  if (consent !== "granted" || !target || privacySignal()) return;
  const clean = sanitizeDetail(detail);
  const id = `${event}|${clean}`;
  if (sent.has(id)) return;
  sent.add(id);
  void fetch(target.url, {
    method: "POST",
    keepalive: true,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: {
      apikey: target.key,
      Authorization: `Bearer ${target.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ event, detail: clean }),
  }).catch(() => {
    /* La analítica nunca debe afectar al uso de la aplicación. */
  });
}
