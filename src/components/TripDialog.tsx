import { useState } from "react";
import type { Search, Stay } from "../types";
import { makeTripUrl } from "../lib/trip";
import { Dialog } from "./Dialog";

export function TripDialog({ search, stays, omitted, onClose }: { search: Search; stays: Stay[]; omitted: number; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const link = search.venue ? makeTripUrl(window.location.href, search, stays) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Enlace copiado.");
    } catch {
      setMessage("No se pudo copiar. Selecciona el enlace y cópialo manualmente.");
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "Viaje CERCA", url: link });
      else await copy();
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setMessage("No se pudo compartir. Prueba a copiar el enlace.");
    }
  }

  return <Dialog title="Compartir viaje" onClose={onClose}>
    <div className="trip-content">
      <p>El enlace contiene el pabellón, las fechas, {search.guests} viajeros y {stays.length} alojamientos seleccionados. Cualquier persona con el enlace podrá ver estos datos.</p>
      {omitted > 0 && <p role="status">{omitted} opción(es) de la comparación quedan fuera porque no pertenecen al catálogo de esta sede.</p>}
      <p>Los nombres y gastos del presupuesto no se incluyen en este enlace.</p>
      {link ? <>
        <label className="trip-field">Enlace del viaje<input readOnly value={link} onFocus={(event) => event.target.select()} /></label>
        <div className="trip-actions"><button className="primary-button" onClick={share}>Compartir viaje</button><button className="secondary-button" onClick={copy}>Copiar enlace</button></div>
      </> : <p role="status">Selecciona un pabellón para crear un enlace de viaje.</p>}
      {message && <p role="status">{message}</p>}
    </div>
  </Dialog>;
}
