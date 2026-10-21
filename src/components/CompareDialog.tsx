import { useState } from "react";
import type { FormEvent } from "react";
import { Heart, Home, Plus } from "lucide-react";
import type { AirbnbQuote, Search, Stay } from "../types";
import {
  distance,
  formatDistance,
  money,
  nights,
  stayPlatformUrl,
} from "../lib/search";
import { estimateStay } from "../lib/estimates";
import { searchOrigin } from "../data/venues";
import { Dialog } from "./Dialog";
import { PhotoCredit, StayPhoto } from "./StayPhoto";

type Selection = { stay: Stay; search: Search };

const validAirbnbUrl = (value: string) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "abnb.me" ||
        host.endsWith(".abnb.me") ||
        /^([a-z0-9-]+\.)?airbnb\.[a-z.]+$/.test(host))
    );
  } catch {
    return false;
  }
};

export function CompareDialog({
  selections,
  search,
  airbnbQuote,
  onAirbnbQuoteChange,
  onClose,
  onOpen,
  remove,
  onTrip,
}: {
  selections: Selection[];
  search: Search;
  airbnbQuote: AirbnbQuote | null;
  onAirbnbQuoteChange: (quote: AirbnbQuote | null) => void;
  onClose: () => void;
  onOpen: (selection: Selection) => void;
  remove: (id: string) => void;
  onTrip: () => void;
}) {
  const [name, setName] = useState(airbnbQuote?.name ?? "");
  const [url, setUrl] = useState(airbnbQuote?.url ?? "");
  const [totalPrice, setTotalPrice] = useState(
    airbnbQuote ? String(airbnbQuote.totalPrice) : "",
  );
  const [distanceKm, setDistanceKm] = useState(
    airbnbQuote?.distanceKm === null || !airbnbQuote
      ? ""
      : String(airbnbQuote.distanceKm),
  );
  const [notes, setNotes] = useState(airbnbQuote?.notes ?? "");
  const [error, setError] = useState("");

  const quotePerPersonNight = airbnbQuote
    ? airbnbQuote.totalPrice / search.guests / nights(search)
    : null;

  function saveAirbnbQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(totalPrice);
    const distanceValue = distanceKm.trim() ? Number(distanceKm) : null;
    if (!Number.isFinite(price) || price <= 0) {
      setError("Introduce el precio final total de la estancia.");
      return;
    }
    if (!validAirbnbUrl(url)) {
      setError("El enlace debe pertenecer a Airbnb.");
      return;
    }
    if (
      distanceValue !== null &&
      (!Number.isFinite(distanceValue) || distanceValue < 0)
    ) {
      setError("La distancia debe ser un número válido.");
      return;
    }
    onAirbnbQuoteChange({
      name: name.trim() || "Opción de Airbnb",
      url: url.trim(),
      totalPrice: price,
      distanceKm: distanceValue,
      notes: notes.trim(),
    });
    setError("");
  }

  function removeAirbnbQuote() {
    onAirbnbQuoteChange(null);
    setName("");
    setUrl("");
    setTotalPrice("");
    setDistanceKm("");
    setNotes("");
    setError("");
  }

  return (
    <Dialog title="¿Con cuál te quedas?" onClose={onClose} wide>
      <div className="compare-body">
        <p className="muted">
          Compara las estimaciones de CERCA para Booking con el precio final que
          veas en Airbnb. CERCA normaliza todos los importes por grupo, persona
          y noche. Confirma las mismas fechas, viajeros, impuestos y gastos en
          ambas plataformas antes de reservar.
        </p>

        <form className="airbnb-quote-form" onSubmit={saveAirbnbQuote}>
          <div className="airbnb-quote-heading">
            <span>
              <Home size={19} aria-hidden="true" />
            </span>
            <div>
              <h3>{airbnbQuote ? "Actualizar Airbnb" : "Añadir un Airbnb"}</h3>
              <p>
                Copia el precio final de toda la estancia, incluidos los gastos
                que muestre Airbnb.
              </p>
            </div>
          </div>
          <div className="airbnb-quote-fields">
            <label>
              Nombre del alojamiento
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Apartamento junto al pabellón"
              />
            </label>
            <label>
              Precio final del grupo (€)
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={totalPrice}
                onChange={(event) => setTotalPrice(event.target.value)}
                placeholder="Ej. 450"
              />
            </label>
            <label>
              Distancia al pabellón (km, opcional)
              <input
                type="number"
                min="0"
                step="0.1"
                value={distanceKm}
                onChange={(event) => setDistanceKm(event.target.value)}
                placeholder="Ej. 1,2"
              />
            </label>
            <label>
              Enlace de Airbnb (opcional)
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.airbnb.es/rooms/..."
              />
            </label>
            <label className="airbnb-quote-notes">
              Cancelación y servicios (opcional)
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ej. Cancelación gratuita, cocina y aparcamiento"
              />
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="airbnb-quote-actions">
            <button className="primary-button" type="submit">
              <Plus size={16} />
              {airbnbQuote
                ? "Actualizar comparación"
                : "Añadir a la comparación"}
            </button>
            {airbnbQuote && (
              <button
                className="secondary-button"
                type="button"
                onClick={removeAirbnbQuote}
              >
                Quitar Airbnb
              </button>
            )}
          </div>
        </form>

        {selections.length > 0 && (
          <button className="secondary-button trip-open" onClick={onTrip}>
            Compartir viaje
          </button>
        )}
        <div className="compare-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>
                  <Heart size={23} />
                  <span>
                    Tus opciones,
                    <br />
                    de un vistazo.
                  </span>
                </th>
                {selections.map((entry) => (
                  <th key={entry.stay.id}>
                    <StayPhoto stay={entry.stay} />
                    <PhotoCredit stay={entry.stay} />
                    <button onClick={() => onOpen(entry)}>
                      {entry.stay.name}
                    </button>
                    <small>{entry.search.town.name} · Booking</small>
                    <button
                      className="compare-remove"
                      onClick={() => remove(entry.stay.id)}
                    >
                      Quitar
                    </button>
                  </th>
                ))}
                {airbnbQuote && (
                  <th className="airbnb-comparison-heading">
                    <span className="airbnb-comparison-placeholder">
                      Airbnb
                    </span>
                    {airbnbQuote.url ? (
                      <a
                        href={airbnbQuote.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {airbnbQuote.name}
                      </a>
                    ) : (
                      <strong>{airbnbQuote.name}</strong>
                    )}
                    <small>{search.town.name} · Airbnb</small>
                    <button
                      className="compare-remove"
                      onClick={removeAirbnbQuote}
                    >
                      Quitar
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Coste por persona y noche</th>
                {selections.map(({ stay, search: selectedSearch }) => (
                  <td key={stay.id}>
                    <strong>
                      ≈{" "}
                      {money(
                        estimateStay(stay, selectedSearch).perPersonNight,
                      )}
                    </strong>
                    <br />
                    <small>Estimación propia de CERCA</small>
                    <br />
                    <a
                      href={stayPlatformUrl(stay, selectedSearch)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {stay.bookingSearch ? "Buscar en" : "Ver en"} Booking
                    </a>
                  </td>
                ))}
                {airbnbQuote && quotePerPersonNight !== null && (
                  <td>
                    <strong>{money(quotePerPersonNight)}</strong>
                    <br />
                    <small>Calculado con el precio introducido</small>
                    {airbnbQuote.url && (
                      <>
                        <br />
                        <a
                          href={airbnbQuote.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver en Airbnb
                        </a>
                      </>
                    )}
                  </td>
                )}
              </tr>
              <tr>
                <th>Total del grupo</th>
                {selections.map(({ stay, search: selectedSearch }) => (
                  <td key={stay.id}>
                    ≈ {money(estimateStay(stay, selectedSearch).totalGroup)}
                    <br />
                    <small>Estimación sin extras</small>
                  </td>
                ))}
                {airbnbQuote && (
                  <td>
                    <strong>{money(airbnbQuote.totalPrice)}</strong>
                    <br />
                    <small>Precio final introducido por ti</small>
                  </td>
                )}
              </tr>
              <tr>
                <th>Distancia al pabellón</th>
                {selections.map(({ stay, search: selectedSearch }) => (
                  <td key={stay.id}>
                    {formatDistance(
                      distance(stay, searchOrigin(selectedSearch)),
                    )}
                  </td>
                ))}
                {airbnbQuote && (
                  <td>
                    {airbnbQuote.distanceKm === null
                      ? "No indicada"
                      : `${airbnbQuote.distanceKm.toLocaleString("es-ES")} km`}
                  </td>
                )}
              </tr>
              <tr>
                <th>Servicios y cancelación</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>Confirmar en Booking</td>
                ))}
                {airbnbQuote && (
                  <td>{airbnbQuote.notes || "Confirmar en Airbnb"}</td>
                )}
              </tr>
              <tr>
                <th>Origen del dato</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>
                    <a href={stay.sourceUrl} target="_blank" rel="noreferrer">
                      {stay.sourceName ?? "Wikidata"} · {stay.retrievedAt}
                    </a>
                  </td>
                ))}
                {airbnbQuote && <td>Precio introducido manualmente</td>}
              </tr>
            </tbody>
          </table>
        </div>
        {!selections.length && !airbnbQuote && (
          <p className="empty-text">
            Añade un Airbnb aquí o selecciona alojamientos del catálogo de
            Booking para empezar la comparación.
          </p>
        )}
      </div>
    </Dialog>
  );
}
