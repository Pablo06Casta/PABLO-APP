import { BarChart3 } from "lucide-react";
import { analyticsAvailable, type AnalyticsConsent } from "../lib/analytics";

export function ConsentBanner({
  consent,
  onChange,
  onMore,
}: {
  consent: AnalyticsConsent;
  onChange: (value: AnalyticsConsent) => void;
  onMore: () => void;
}) {
  if (consent !== "unset" || !analyticsAvailable()) return null;
  return (
    <section
      className="consent-banner"
      role="region"
      aria-labelledby="consent-title"
    >
      <BarChart3 size={22} aria-hidden="true" className="consent-icon" />
      <div className="consent-copy">
        <h2 id="consent-title">¿Nos ayudas a mejorar CERCA?</h2>
        <p>
          Con tu permiso contaremos de forma anónima qué secciones, destinos y
          funciones se usan. No usamos cookies, no creamos perfiles ni
          identificadores y solo guardamos tu elección en este navegador. Puedes
          cambiarla cuando quieras en Privacidad.{" "}
          <button className="text-button inline-link" onClick={onMore}>
            Más información
          </button>
        </p>
      </div>
      <div className="consent-actions">
        <button className="secondary-button" onClick={() => onChange("denied")}>
          Rechazar
        </button>
        <button className="secondary-button" onClick={() => onChange("granted")}>
          Aceptar
        </button>
      </div>
    </section>
  );
}
