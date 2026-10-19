import { useRef, useState } from "react";
import { ArrowDownToLine, Plus, Trash2, Users, Wallet } from "lucide-react";
import type { Search, Stay } from "../types";
import { nights } from "../lib/search";
import {
  budgetCategories,
  calculateDetailedBudget,
  type BudgetEntry,
  type BudgetScope,
} from "../lib/detailedBudget";

const euros = (cents: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

export function GroupBudgetSection({ search, stays }: { search: Search; stays: Stay[] }) {
  const [destinationState, setDestinationState] = useState({ town: search.town.name, value: search.town.name });
  const [peopleRaw, setPeopleRaw] = useState(String(search.guests));
  const [names, setNames] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const nextId = useRef(0);
  const destination = destinationState.town !== search.town.name && destinationState.value === destinationState.town ? search.town.name : destinationState.value;
  const activeSelectedId = stays.some((item) => item.id === selectedId) ? selectedId : "";
  const stay = stays.find((item) => item.id === activeSelectedId);
  const { error, result } = calculateDetailedBudget({ search, destination, peopleRaw, names, entries, stay });
  const people = /^\d+$/.test(peopleRaw) ? Math.min(100, Math.max(0, Number(peopleRaw))) : 0;

  function addExpense() {
    if (entries.length >= 50) return;
    setEntries((current) => [...current, {
      id: String(++nextId.current),
      category: "Comida",
      concept: "",
      amount: "",
      scope: "group",
      days: "1",
      individualAmounts: [],
    }]);
  }
  function updateExpense(id: string, patch: Partial<BudgetEntry>) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  }
  async function downloadPdf() {
    if (!result || pdfBusy) return;
    setPdfBusy(true);
    setPdfMessage("");
    try {
      const { downloadBudgetPdf } = await import("../lib/budgetPdf");
      await downloadBudgetPdf(result, search, stay);
      setPdfMessage("PDF generado y descargado.");
    } catch {
      setPdfMessage("No se pudo generar el PDF. Vuelve a intentarlo.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <section id="presupuesto" className="group-budget" aria-labelledby="budget-title">
      <div className="group-budget-heading">
        <div>
          <p className="small-caps"><Wallet size={16} /> ORGANIZA LOS GASTOS DE TU EQUIPO</p>
          <h2 id="budget-title">Presupuesto del grupo<span className="heading-dot">.</span></h2>
          <p>Prepara el viaje completo y descubre cuánto aporta cada persona. Este presupuesto permanece en esta sesión; los nombres y gastos no se incluyen en el enlace compartido.</p>
        </div>
        <div className="group-budget-heading-icon" aria-hidden="true"><Users size={30} /></div>
      </div>

      <div className="group-budget-layout">
        <div className="group-budget-form">
          <div className="budget-block">
            <h2>El viaje y sus viajeros</h2>
            <div className="budget-fields">
              <label className="trip-field">Dónde viajamos
                <input value={destination} maxLength={120} onChange={(event) => setDestinationState({ town: search.town.name, value: event.target.value })} placeholder="Destino del viaje" />
              </label>
              <label className="trip-field">Número de personas
                <input type="number" min="1" max="100" step="1" value={peopleRaw} onChange={(event) => setPeopleRaw(event.target.value)} />
              </label>
            </div>
            <p className="budget-helper">Escribe los nombres si quieres incluirlos en el PDF. Los campos vacíos aparecerán como Viajero 1, Viajero 2…</p>
            <div className="budget-names">
              {Array.from({ length: people }, (_, index) => <label className="trip-field" key={index}>Viajero {index + 1}
                <input value={names[index] ?? ""} maxLength={60} placeholder={`Viajero ${index + 1}`} onChange={(event) => setNames((current) => { const next = [...current]; next[index] = event.target.value; return next; })} />
              </label>)}
            </div>
          </div>

          <div className="budget-block">
            <h2>Alojamiento de la comparación</h2>
            <p className="budget-helper">Puedes usar una sola estimación de CERCA para {nights(search)} noches, o añadir alojamientos con tu propio precio como gastos. Las opciones de la comparación son alternativas.</p>
            <label className="trip-field">Alojamiento estimado
              <select value={activeSelectedId} onChange={(event) => setSelectedId(event.target.value)}>
                <option value="">Sin estimación de CERCA</option>
                {stays.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            {stay && <p className="budget-helper">Estimación CERCA: {euros(result?.lodgingCents ?? 0)} para toda la estancia. Confirma precio, capacidad, impuestos y disponibilidad.</p>}
            {stay && entries.some((entry) => entry.category === "Alojamiento") && <p className="budget-helper">También has añadido alojamientos manuales: se suman como gastos adicionales.</p>}
          </div>

          <div className="budget-block">
            <div className="budget-block-title"><div><h2>Gastos del grupo</h2><p className="budget-helper">Añade restaurantes, comidas, gasolinas, transportes, alojamientos u otros conceptos. Puedes repartir un gasto común o indicar un importe diferente para cada viajero.</p></div><button className="secondary-button" onClick={addExpense} disabled={entries.length >= 50}><Plus size={16} /> Añadir gasto</button></div>
            {!entries.length && <p className="budget-empty">Todavía no has añadido gastos. Pulsa «Añadir gasto» para empezar.</p>}
            <div className="budget-expenses">
              {entries.map((entry, index) => <div className="budget-expense" key={entry.id}>
                <div className="budget-expense-heading"><strong>Gasto {index + 1}</strong><button className="icon-button" aria-label={`Eliminar gasto ${index + 1}`} onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}><Trash2 size={17} /></button></div>
                <div className="budget-fields">
                  <label className="trip-field">Categoría
                    <select value={entry.category} onChange={(event) => updateExpense(entry.id, { category: event.target.value as BudgetEntry["category"] })}>{budgetCategories.map((category) => <option key={category}>{category}</option>)}</select>
                  </label>
                  <label className="trip-field">Nombre del gasto
                    <input value={entry.concept} maxLength={100} placeholder="Ej. Cena del sábado" onChange={(event) => updateExpense(entry.id, { concept: event.target.value })} />
                  </label>
                  {entry.scope !== "individual" && <label className="trip-field">Precio (€)
                    <input value={entry.amount} inputMode="decimal" placeholder="0,00" onChange={(event) => updateExpense(entry.id, { amount: event.target.value })} />
                  </label>}
                  <label className="trip-field">Este precio es
                    <select value={entry.scope} onChange={(event) => updateExpense(entry.id, { scope: event.target.value as BudgetScope })}>
                      <option value="group">Total del grupo</option>
                      <option value="person">Por persona</option>
                      <option value="personDay">Por persona y día</option>
                      <option value="individual">Importe distinto por viajero</option>
                    </select>
                  </label>
                  {entry.scope === "personDay" && <label className="trip-field">Días para este gasto
                    <input type="number" min="1" max="366" step="1" value={entry.days} onChange={(event) => updateExpense(entry.id, { days: event.target.value })} />
                  </label>}
                </div>
                {entry.scope === "individual" && <div className="budget-individual">
                  <p className="budget-helper">Indica el gasto de cada persona. Un campo vacío cuenta como 0 €. Estos importes solo se suman a esa persona.</p>
                  <div className="budget-names">
                    {Array.from({ length: people }, (_, personIndex) => <label className="trip-field" key={personIndex}>{names[personIndex]?.trim() || `Viajero ${personIndex + 1}`} (€)
                      <input inputMode="decimal" placeholder="0,00" value={entry.individualAmounts?.[personIndex] ?? ""} onChange={(event) => {
                        const individualAmounts = [...(entry.individualAmounts ?? [])];
                        individualAmounts[personIndex] = event.target.value;
                        updateExpense(entry.id, { individualAmounts });
                      }} />
                    </label>)}
                  </div>
                </div>}
                {result && <p className="budget-line-total">Total de este gasto: <strong>{euros(result.entries[index].cents)}</strong></p>}
              </div>)}
            </div>
          </div>
        </div>

        <aside className="budget-summary" aria-labelledby="budget-summary-title">
          <h2 id="budget-summary-title">Resumen del viaje</h2>
          <p>{destination.trim() || "Destino pendiente"} · {peopleRaw || "0"} viajeros</p>
          {error && <p className="budget-error" role="alert">{error}</p>}
          {result && <>
            <div className="budget-summary-lines">
              {stay && <p><span>Alojamiento estimado · CERCA</span><strong>{euros(result.lodgingCents)}</strong></p>}
              {result.entries.map((entry) => <p key={entry.id}><span>{entry.category}: {entry.concept}</span><strong>{euros(entry.cents)}</strong></p>)}
              {!stay && !result.entries.length && <p className="budget-helper">Añade un gasto o un alojamiento para completar el presupuesto.</p>}
            </div>
            <div className="budget-grand-total"><span>Total del grupo</span><strong>{euros(result.totalCents)}</strong></div>
            <h3>Aportación por persona</h3>
            <p className="budget-helper">Los gastos comunes se reparten a partes iguales; los importes individuales se añaden solo a su viajero. Si sobran céntimos del reparto común, se asignan por orden de la lista.</p>
            <div className="budget-contributions">{result.names.map((name, index) => <p key={index}><span>{name}{result.individualTotals[index] > 0 && <small> · individual {euros(result.individualTotals[index])}</small>}</span><strong>{euros(result.contributions[index])}</strong></p>)}</div>
            <button className="primary-button budget-download" disabled={pdfBusy || (!stay && !entries.length)} onClick={downloadPdf}><ArrowDownToLine size={17} /> {pdfBusy ? "Generando PDF…" : "Descargar presupuesto en PDF"}</button>
            {pdfMessage && <p role="status">{pdfMessage}</p>}
          </>}
          <p className="budget-helper">Los importes introducidos son tuyos. La estimación de CERCA no confirma una reserva; precios y disponibilidad pueden cambiar por eventos o festivos.</p>
        </aside>
      </div>
    </section>
  );
}
