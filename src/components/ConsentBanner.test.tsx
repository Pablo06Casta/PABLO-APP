import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "./ConsentBanner";

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://proyecto.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "clave-publica");
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("Aviso de estadística de uso", () => {
  it("ofrece aceptar y rechazar con el mismo peso", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onMore = vi.fn();
    render(<ConsentBanner consent="unset" onChange={onChange} onMore={onMore} />);
    const banner = screen.getByRole("region", {
      name: "¿Nos ayudas a mejorar CERCA?",
    });
    const accept = screen.getByRole("button", { name: "Aceptar" });
    const reject = screen.getByRole("button", { name: "Rechazar" });
    expect(accept.className).toBe(reject.className);
    expect(banner.textContent).toContain("No usamos cookies");
    await user.click(reject);
    expect(onChange).toHaveBeenCalledWith("denied");
    await user.click(screen.getByRole("button", { name: "Más información" }));
    expect(onMore).toHaveBeenCalledOnce();
  });

  it("no aparece si ya hay una elección o la estadística no está configurada", () => {
    const { rerender } = render(
      <ConsentBanner consent="granted" onChange={() => {}} onMore={() => {}} />,
    );
    expect(screen.queryByRole("region")).toBeNull();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_SUPABASE_URL", "");
    rerender(
      <ConsentBanner consent="unset" onChange={() => {}} onMore={() => {}} />,
    );
    expect(screen.queryByRole("region")).toBeNull();
  });
});
