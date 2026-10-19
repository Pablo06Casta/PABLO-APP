import { useState } from "react";
import type { Search, Stay } from "../types";
import { nights } from "../lib/search";
import { groupBudget } from "../lib/groupBudget";
import { makeTripUrl } from "../lib/trip";
import { Dialog } from "./Dialog";
const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function TripDialog({ search, stays, omitted, onClose }: { search: Search; stays: Stay[]; omitted: number; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState(stays[0]?.id ?? "");
  const [people, setPeople] = useState(String(search.guests));
  const [transport, setTransport] = useState("0");
  const [food, setFood] = useState("0");
  const [days, setDays] = useState(String(nights(search)));
  const [other, setOther] = useState("0");
  const [message, setMessage] = useState("");
  const numbers = [people, transport, food, days, other];
  const budget = numbers.every((value) => value.trim() !== "") ? groupBudget(search, stays.find((stay) => stay.id === selectedId), Number(transport), Number(food), Number(days), Number(other), Number(people)) : null;
  const link = search.venue ? makeTripUrl(window.location.href, search, stays) : "";
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "Viaje CERCA", url: link });
      else await copy();
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setMessage("No se pudo compartir. Prueba a copiar el enlace.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Enlace copiado.");
    } catch {
      setMessage("No se pudo copiar. Selecciona el enlace y cópialo manualmente.");
    }
  }
  return <Dialog title="Tu viaje en grupo" onClose={onClose} wide>
    <div className="trip-content">
      <section className="trip-panel">
        <h3>Compartir viaje</h3>
        <p>El enlace contiene el pabellón, las fechas, {search.guests} viajeros y {stays.length} alojamientos seleccionados. Cualquier persona con el enlace podrá ver estos datos.</p>
        {omitted > 0 && <p role="status">{omitted} opción(es) de la comparación quedan fuera del viaje porque no pertenecen al catálogo de esta sede.</p>}
        <p>Los gastos que introduzcas aquí no se incluyen en el enlace.</p>
        {link ? <>
          <label className="trip-field">Enlace del viaje<input readOnly value={link} onFocus={(event) => event.target.select()} /></label>
          <div className="trip-actions"><button className="primary-button" onClick={share}>Compartir viaje</button><button className="secondary-button" onClick={copy}>Copiar enlace</button></div>
        </> : <p role="status">Selecciona un pabellón para crear un enlace de viaje.</p>}
        {message && <p role="status">{message}</p>}
      </section>
      <section className="trip-panel">
        <h3>Presupuesto del grupo</h3>
        <p>El alojamiento cubre {nights(search)} noches. Elige una sola opción de la comparación; las demás son alternativas. Los importes de CERCA son orientativos y pueden cambiar por disponibilidad, eventos o festivos.</p>
        <div className="trip-fields">
          <label className="trip-field">Alojamiento de referencia<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Sin alojamiento</option>{stays.map((stay) => <option key={stay.id} value={stay.id}>{stay.name}</option>)}</select></label>
          <label className="trip-field">Personas que comparten gastos<input type="number" min="1" max="100" step="1" value={people} onChange={(event) => setPeople(event.target.value)} /></label>
          <label className="trip-field">Transporte del grupo (€) · tu importe<input type="number" min="0" max="1000000" step="0.01" value={transport} onChange={(event) => setTransport(event.target.value)} /></label>
          <label className="trip-field">Comida por persona y día (€) · tu importe<input type="number" min="0" max="1000000" step="0.01" value={food} onChange={(event) => setFood(event.target.value)} /></label>
          <label className="trip-field">Días de comida<input type="number" min="0" max="366" step="1" value={days} onChange={(event) => setDays(event.target.value)} /></label>
          <label className="trip-field">Otros gastos del grupo (€) · tu importe<input type="number" min="0" max="1000000" step="0.01" value={other} onChange={(event) => setOther(event.target.value)} /></label>
        </div>
        {!budget ? <p role="alert">Revisa los importes y las cantidades: deben ser números válidos, sin valores negativos, debe haber al menos una persona y respetarse la capacidad publicada del alojamiento.</p> : <div className="trip-totals" aria-live="polite">
          <p>Alojamiento · estimación CERCA: <strong>{money(budget.lodging)}</strong></p>
          <p>Transporte · tu importe: <strong>{money(budget.transport)}</strong></p>
          <p>Comida · tu importe × {days} días × {people} personas: <strong>{money(budget.food)}</strong></p>
          <p>Otros · tu importe: <strong>{money(budget.other)}</strong></p>
          <p>Total del grupo: <strong>{money(budget.total)}</strong></p>
          <p>Por persona: <strong>{money(budget.perPerson)}</strong></p>
        </div>}
        <small>El alojamiento usa el modelo de CERCA para el número de personas indicado. No confirma precio, capacidad ni disponibilidad. No incluye extras o impuestos no publicados; confirma las condiciones en la plataforma.</small>
      </section>
    </div>
  </Dialog>;
}
