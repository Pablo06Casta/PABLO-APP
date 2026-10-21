import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Fuel,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import type { Search } from "../types";
import { useStored } from "../lib/storage";
import {
  TEAM_UTILITIES_STORAGE_KEY,
  calculateCarTrip,
  initialTeamUtilities,
  passengerNames,
  paymentTotals,
  sanitizeTeamUtilities,
  type TeamCar,
  type TeamPayment,
  type TeamUtilitiesData,
} from "../lib/teamUtilities";

const euros = (value: number) => new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value);
const number = (value: number, digits = 1) => new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: digits,
}).format(value);
let nextId = 0;
const id = (prefix: string) => `${prefix}-${Date.now()}-${nextId++}`;

export function TeamUtilitiesSection({ search }: { search: Search }) {
  const initial = initialTeamUtilities(search.guests);
  const [data, setData] = useStored<TeamUtilitiesData>(TEAM_UTILITIES_STORAGE_KEY, initial, sanitizeTeamUtilities);
  const [newItem, setNewItem] = useState("");
  const trip = calculateCarTrip(data.trip);
  const payments = paymentTotals(data.payments);
  const packed = data.checklist.filter((item) => item.checked).length;
  const carSummary = data.cars.reduce((summary, car) => {
    const passengers = passengerNames(car.passengers).length;
    const seats = Math.max(0, Math.min(20, Math.trunc(Number(car.passengerSeats)) || 0));
    summary.people += (car.driver.trim() ? 1 : 0) + passengers;
    summary.free += Math.max(0, seats - passengers);
    summary.over += Math.max(0, passengers - seats);
    return summary;
  }, { people: 0, free: 0, over: 0 });

  useEffect(() => {
    const clear = () => setData(initialTeamUtilities(search.guests));
    window.addEventListener("cerca-team-utilities-cleared", clear);
    return () => window.removeEventListener("cerca-team-utilities-cleared", clear);
  }, [search.guests, setData]);

  const updateTrip = (key: keyof TeamUtilitiesData["trip"], value: string) =>
    setData((current) => ({ ...current, trip: { ...current.trip, [key]: value } }));
  const updateCar = (carId: string, patch: Partial<TeamCar>) =>
    setData((current) => ({ ...current, cars: current.cars.map((car) => car.id === carId ? { ...car, ...patch } : car) }));
  const updatePayment = (paymentId: string, patch: Partial<TeamPayment>) =>
    setData((current) => ({ ...current, payments: current.payments.map((payment) => payment.id === paymentId ? { ...payment, ...patch } : payment) }));

  function addChecklistItem() {
    const label = newItem.trim();
    if (!label || data.checklist.length >= 100) return;
    setData((current) => ({ ...current, checklist: [...current.checklist, { id: id("item"), label: label.slice(0, 100), checked: false }] }));
    setNewItem("");
  }

  return (
    <section id="utilidades" className="team-utilities" aria-labelledby="utilities-title">
      <header className="group-budget-heading utilities-heading">
        <div>
          <span className="small-caps"><ClipboardCheck size={15} /> ORGANIZA AL EQUIPO</span>
          <h1 id="utilities-title">Utilidades del viaje</h1>
          <p>Calcula el desplazamiento, reparte los coches, controla los pagos y prepara el material. Los cambios se guardan automáticamente en este dispositivo.</p>
        </div>
        <span className="group-budget-heading-icon"><ClipboardCheck size={27} /></span>
      </header>

      <div className="utilities-grid">
        <article className="utility-card utility-trip">
          <div className="utility-card-heading"><span><Fuel size={21} /></span><div><h2>Calculadora del viaje</h2><p>Combustible, peajes y coste por persona.</p></div></div>
          <div className="utility-fields">
            <label className="trip-field">Distancia de un trayecto (km)<input aria-label="Distancia de un trayecto (km)" inputMode="decimal" placeholder="Ej. 180" value={data.trip.distanceKm} onChange={(event) => updateTrip("distanceKm", event.target.value)} /></label>
            <label className="trip-field">Número de trayectos<input aria-label="Número de trayectos" type="number" min="1" max="20" value={data.trip.journeys} onChange={(event) => updateTrip("journeys", event.target.value)} /></label>
            <label className="trip-field">Consumo (l/100 km)<input aria-label="Consumo (l/100 km)" inputMode="decimal" placeholder="Ej. 6,5" value={data.trip.consumption} onChange={(event) => updateTrip("consumption", event.target.value)} /></label>
            <label className="trip-field">Precio combustible (€/l)<input aria-label="Precio combustible (€/l)" inputMode="decimal" placeholder="Ej. 1,70" value={data.trip.fuelPrice} onChange={(event) => updateTrip("fuelPrice", event.target.value)} /></label>
            <label className="trip-field">Peajes totales (€)<input aria-label="Peajes totales (€)" inputMode="decimal" value={data.trip.tolls} onChange={(event) => updateTrip("tolls", event.target.value)} /></label>
            <label className="trip-field">Personas que pagan<input aria-label="Personas que pagan" type="number" min="1" max="100" value={data.trip.people} onChange={(event) => updateTrip("people", event.target.value)} /></label>
          </div>
          <div className="utility-result" aria-live="polite">
            <p><span>Distancia total</span><strong>{number(trip.totalKm)} km</strong></p>
            <p><span>Combustible estimado</span><strong>{number(trip.litres)} l · {euros(trip.fuelCost)}</strong></p>
            <p><span>Viaje y peajes</span><strong>{euros(trip.totalCost)}</strong></p>
            <p className="utility-result-main"><span>Por persona</span><strong>{euros(trip.perPerson)}</strong></p>
          </div>
        </article>

        <article className="utility-card utility-cars">
          <div className="utility-card-heading"><span><Car size={21} /></span><div><h2>Reparto de coches</h2><p>Conductores, pasajeros, salida y hora.</p></div></div>
          <div className="utility-summary"><strong>{carSummary.people}</strong> personas asignadas · <strong>{carSummary.free}</strong> plazas libres</div>
          {carSummary.over > 0 && <p className="utility-warning" role="alert">Faltan {carSummary.over} plazas en los coches.</p>}
          <div className="utility-rows">
            {data.cars.map((car, index) => {
              const count = passengerNames(car.passengers).length;
              const seats = Math.max(0, Math.trunc(Number(car.passengerSeats)) || 0);
              return <div className="utility-row" key={car.id}>
                <div className="utility-row-heading"><strong>Coche {index + 1}</strong><button className="icon-button" aria-label={`Eliminar coche ${index + 1}`} onClick={() => setData((current) => ({ ...current, cars: current.cars.filter((item) => item.id !== car.id) }))}><Trash2 size={16} /></button></div>
                <div className="utility-fields">
                  <label className="trip-field">Conductor<input value={car.driver} maxLength={60} onChange={(event) => updateCar(car.id, { driver: event.target.value })} /></label>
                  <label className="trip-field">Plazas para pasajeros<input type="number" min="0" max="20" value={car.passengerSeats} onChange={(event) => updateCar(car.id, { passengerSeats: event.target.value })} /></label>
                  <label className="trip-field utility-wide">Pasajeros, separados por comas<input value={car.passengers} maxLength={500} placeholder="Ana, Luis, Marta" onChange={(event) => updateCar(car.id, { passengers: event.target.value })} /></label>
                  <label className="trip-field">Punto de salida<input value={car.departure} maxLength={100} placeholder="Ej. Plaza Mayor" onChange={(event) => updateCar(car.id, { departure: event.target.value })} /></label>
                  <label className="trip-field">Hora<input type="time" value={car.time} onChange={(event) => updateCar(car.id, { time: event.target.value })} /></label>
                </div>
                <small className={count > seats ? "utility-over" : ""}>{count} de {seats} plazas de pasajero ocupadas</small>
              </div>;
            })}
          </div>
          <button className="secondary-button utility-add" disabled={data.cars.length >= 20} onClick={() => setData((current) => ({ ...current, cars: [...current.cars, { id: id("car"), driver: "", passengerSeats: "4", passengers: "", departure: "", time: "" }] }))}><Plus size={16} /> Añadir coche</button>
        </article>

        <article className="utility-card utility-payments">
          <div className="utility-card-heading"><span><WalletCards size={21} /></span><div><h2>Control de pagos</h2><p>Comprueba quién ha pagado y cuánto falta.</p></div></div>
          <div className="payment-totals"><span>Total <strong>{euros(payments.total)}</strong></span><span>Pagado <strong>{euros(payments.paid)}</strong></span><span>Pendiente <strong>{euros(payments.pending)}</strong></span></div>
          <div className="utility-rows">
            {data.payments.map((payment, index) => <div className="payment-row" key={payment.id}>
              <label className="payment-check"><input type="checkbox" checked={payment.paid} onChange={(event) => updatePayment(payment.id, { paid: event.target.checked })} /><span>{payment.paid ? <CheckCircle2 size={19} /> : <Circle size={19} />}<span className="sr-only">{payment.paid ? "Pagado" : "Pendiente"}</span></span></label>
              <input aria-label={`Nombre del pago ${index + 1}`} value={payment.name} maxLength={60} placeholder="Nombre" onChange={(event) => updatePayment(payment.id, { name: event.target.value })} />
              <div className="payment-amount"><input aria-label={`Importe del pago ${index + 1}`} inputMode="decimal" value={payment.amount} placeholder="0,00" onChange={(event) => updatePayment(payment.id, { amount: event.target.value })} /><span>€</span></div>
              <button className="icon-button" aria-label={`Eliminar pago ${index + 1}`} onClick={() => setData((current) => ({ ...current, payments: current.payments.filter((item) => item.id !== payment.id) }))}><Trash2 size={16} /></button>
            </div>)}
          </div>
          {!data.payments.length && <p className="utility-empty">Añade a cada persona para empezar a controlar los pagos.</p>}
          <button className="secondary-button utility-add" disabled={data.payments.length >= 100} onClick={() => setData((current) => ({ ...current, payments: [...current.payments, { id: id("payment"), name: "", amount: "", paid: false }] }))}><Plus size={16} /> Añadir persona</button>
        </article>

        <article className="utility-card utility-checklist">
          <div className="utility-card-heading"><span><Users size={21} /></span><div><h2>Lista de material</h2><p>{packed} de {data.checklist.length} elementos preparados.</p></div></div>
          <div className="checklist-progress"><span style={{ width: `${data.checklist.length ? (packed / data.checklist.length) * 100 : 0}%` }} /></div>
          <div className="checklist-items">
            {data.checklist.map((item) => <div className={item.checked ? "checked" : ""} key={item.id}>
              <label><input type="checkbox" checked={item.checked} onChange={() => setData((current) => ({ ...current, checklist: current.checklist.map((entry) => entry.id === item.id ? { ...entry, checked: !entry.checked } : entry) }))} /><span>{item.checked ? <CheckCircle2 size={19} /> : <Circle size={19} />}</span><span>{item.label}</span></label>
              <button className="icon-button" aria-label={`Eliminar ${item.label}`} onClick={() => setData((current) => ({ ...current, checklist: current.checklist.filter((entry) => entry.id !== item.id) }))}><Trash2 size={15} /></button>
            </div>)}
          </div>
          <div className="checklist-add"><input aria-label="Nuevo elemento de material" maxLength={100} placeholder="Añadir otro elemento" value={newItem} onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addChecklistItem(); }} /><button className="secondary-button" onClick={addChecklistItem} disabled={!newItem.trim()}><Plus size={16} /> Añadir</button></div>
          <button className="text-button checklist-reset" onClick={() => setData((current) => ({ ...current, checklist: current.checklist.map((item) => ({ ...item, checked: false })) }))}><RotateCcw size={14} /> Desmarcar todo</button>
        </article>
      </div>
    </section>
  );
}
