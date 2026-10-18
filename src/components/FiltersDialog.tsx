import { useState } from "react";
import { Check, RotateCcw, ShoppingBasket } from "lucide-react";
import type { Filters } from "../types";
import { initialFilters } from "../lib/search";
import { Dialog } from "./Dialog";
export function FiltersDialog({
  filters,
  onApply,
  onClose,
  hasMarkets,
  loadMarkets,
  marketsLoading,
  marketError,
  nearVenue = false,
}: {
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
  hasMarkets: boolean;
  loadMarkets: () => void;
  marketsLoading: boolean;
  marketError?: string;
  nearVenue?: boolean;
}) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState("");
  return (
    <Dialog title="Tu estancia para el torneo" onClose={onClose}>
      <div className="filter-body">
        <section>
          <h3>Presupuesto estimado por persona y noche</h3>
          <p>
            Se filtra por la estimación central, no por una tarifa confirmada.
            Los rangos pueden superar tu presupuesto. Extras no incluidos.
          </p>
          <div className="price-inputs">
            <label>
              Mínimo (€)
              <input
                type="number"
                min="0"
                max="1000"
                value={draft.minPrice}
                onChange={(e) =>
                  setDraft({ ...draft, minPrice: Number(e.target.value) })
                }
              />
            </label>
            <span>—</span>
            <label>
              Máximo (€)
              <input
                type="number"
                min="0"
                max="1000"
                value={draft.maxPrice}
                onChange={(e) =>
                  setDraft({ ...draft, maxPrice: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <input
            className="range-input"
            aria-label="Presupuesto máximo estimado por persona"
            type="range"
            min="10"
            max="200"
            step="5"
            value={draft.maxPrice}
            onChange={(e) =>
              setDraft({ ...draft, maxPrice: Number(e.target.value) })
            }
          />
        </section>
        <section className="filter-grid">
          <label>
            Plataforma
            <select
              value={draft.platform ?? "Todos"}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  platform: e.target.value as Filters["platform"],
                })
              }
            >
              <option>Todos</option>
              <option>Booking</option>
              <option>Airbnb</option>
            </select>
          </label>
          <label>
            Distancia máxima al {nearVenue ? "pabellón" : "centro"}
            <select
              value={draft.maxDistance}
              onChange={(e) =>
                setDraft({ ...draft, maxDistance: Number(e.target.value) })
              }
            >
              <option value="0.5">500 metros</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </label>
        </section>
        <section>
          <h3>Para organizar el equipo</h3>
          <p>
            Capacidad y estancia mínima filtran los anuncios que publican esos
            datos. En hoteles sin capacidad confirmada se presuponen
            habitaciones dobles; debes comprobarlo al reservar.
          </p>
          <div className="filter-checks">
            {(
              [
                ["kitchen", "Cocina publicada en el catálogo"],
                ["parking", "Aparcamiento publicado en el catálogo"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.checked })
                  }
                />
                <span className="custom-checkbox">
                  <Check size={13} />
                </span>
                {label}
              </label>
            ))}
          </div>
        </section>
        <section>
          <h3>
            <ShoppingBasket size={18} /> La compra junto al{" "}
            {nearVenue ? "pabellón" : "centro"}
          </h3>
          <p>
            Consulta supermercados y tiendas de alimentación alrededor del punto
            de competición.
          </p>
          {!hasMarkets ? (
            <button
              className="secondary-button"
              onClick={loadMarkets}
              disabled={marketsLoading}
            >
              {marketsLoading
                ? "Consultando supermercados…"
                : "Consultar supermercados reales"}
            </button>
          ) : (
            <div className="filter-chips">
              {[0, 0.5, 1, 2].map((km) => (
                <button
                  key={km}
                  className={draft.marketDistance === km ? "selected" : ""}
                  onClick={() => setDraft({ ...draft, marketDistance: km })}
                >
                  {km === 0
                    ? "Sin límite"
                    : `Compra a menos de ${km < 1 ? "500 m" : `${km} km`}`}
                </button>
              ))}
            </div>
          )}
          {hasMarkets && (
            <small>
              El filtro comprueba la distancia entre alojamiento y una tienda
              del área consultada alrededor del pabellón.
            </small>
          )}
          {marketError && (
            <p className="form-error" role="alert">
              {marketError}
            </p>
          )}
        </section>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="dialog-footer">
        <button
          className="text-button"
          onClick={() => {
            setDraft({ ...initialFilters });
            setError("");
          }}
        >
          <RotateCcw size={15} /> Restablecer
        </button>
        <button
          className="primary-button"
          onClick={() => {
            if (
              !Number.isFinite(draft.minPrice) ||
              !Number.isFinite(draft.maxPrice) ||
              draft.minPrice < 0 ||
              draft.maxPrice < draft.minPrice
            ) {
              setError("Introduce un intervalo de presupuesto válido.");
              return;
            }
            onApply(draft);
          }}
        >
          Aplicar filtros
        </button>
      </div>
    </Dialog>
  );
}
