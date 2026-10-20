import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consentKey,
  getConsent,
  sanitizeDetail,
  setConsent,
  track,
} from "./analytics";

const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://proyecto.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "clave-publica");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  localStorage.clear();
  setConsent("unset");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, "globalPrivacyControl", {
    value: undefined,
    configurable: true,
  });
});

describe("Estadística de uso con consentimiento", () => {
  it("no envía nada sin consentimiento ni tras rechazarlo", () => {
    track("section", "explore");
    setConsent("denied");
    track("section", "explore");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(consentKey)).toBe("denied");
  });

  it("envía solo el evento y un identificador público, una vez por visita", () => {
    setConsent("granted");
    track("destination", "Vitoria-Aldabe");
    track("destination", "vitoria-aldabe");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://proyecto.supabase.co/rest/v1/usage_events");
    expect(init.credentials).toBe("omit");
    expect(init.referrerPolicy).toBe("no-referrer");
    expect(JSON.parse(init.body as string)).toEqual({
      event: "destination",
      detail: "vitoria-aldabe",
    });
  });

  it("respeta Global Privacy Control aunque se haya aceptado", () => {
    Object.defineProperty(navigator, "globalPrivacyControl", {
      value: true,
      configurable: true,
    });
    setConsent("granted");
    track("section", "budget");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retirar el consentimiento borra la elección guardada", () => {
    setConsent("granted");
    setConsent("unset");
    expect(getConsent()).toBe("unset");
    expect(localStorage.getItem(consentKey)).toBeNull();
  });

  it("limpia los identificadores antes de enviarlos", () => {
    expect(sanitizeDetail("Ciudad Real / Pabellón")).toBe("ciudad-real-pabellon");
    expect(sanitizeDetail("x".repeat(80))).toHaveLength(64);
  });
});
