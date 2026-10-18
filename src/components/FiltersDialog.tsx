import { useState } from "react";
import { Check, RotateCcw, ShoppingBasket } from "lucide-react";
import type { Filters } from "../types";
import { initialFilters, money } from "../lib/search";
import { Dialog } from "./Dialog";
export function FiltersDialog({
  filters,
  onApply,
  onClose,
  hasMarkets,
  loadMarkets,
  marketsLoading,
  marketError,
}: {
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
  hasMarkets: boolean;
  loadMarkets: () => void;
  marketsLoading: boolean;
  marketError?: string;
}) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState("");
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Dialog title="Encuentra tu lugar ideal" onClose={onClose}>
      <div className="filter-body">
        <section>
          <h3>Tu presupuesto, a tu medida</h3>
          <p>Precio de demostración por noche, en euros.</p>
          <div className="price-histogram" aria-hidden="true">
            {[
              12, 18, 24, 38, 52, 66, 76, 92, 100, 88, 96, 76, 68, 50, 45, 32,
              27, 20, 13, 8,
            ].map((height, index) => (
              <i key={index} style={{ height: height + "%" }} />
            ))}
          </div>
          <div className="price-inputs">
            <label>
              Mínimo (€)
              <input
                type="number"
                min="0"
                max="1000"
                value={draft.minPrice}
                onChange={(event) =>
                  update("minPrice", Number(event.target.value))
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
                onChange={(event) =>
                  update("maxPrice", Number(event.target.value))
                }
              />
            </label>
          </div>
          <input
            aria-label="Precio máximo por noche"
            className="range-input"
            type="range"
            min="30"
            max="200"
            step="5"
            value={draft.maxPrice}
            onChange={(event) => update("maxPrice", Number(event.target.value))}
          />
          <small>Hasta {money(draft.maxPrice)} por noche</small>
        </section>
        <section className="filter-grid">
          <label>
            Distancia máxima al centro
            <select
              value={draft.maxDistance}
              onChange={(event) =>
                update("maxDistance", Number(event.target.value))
              }
            >
              <option value="0.5">500 metros</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </label>
          <label>
            Valoración mínima (demo)
            <select
              value={draft.minRating}
              onChange={(event) =>
                update("minRating", Number(event.target.value))
              }
            >
              <option value="0">Cualquier valoración</option>
              <option value="4.8">4,8 o más</option>
              <option value="4.9">4,9 o más</option>
              <option value="4.95">4,95 o más</option>
            </select>
          </label>
        </section>
        <section>
          <h3>Esos pequeños imprescindibles</h3>
          <div className="filter-checks">
            {(
              [
                ["cancellation", "Cancelación gratuita"],
                ["parking", "Aparcamiento"],
                ["kitchen", "Cocina"],
              ] as const
            ).map(([key, text]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(event) => update(key, event.target.checked)}
                />
                <span className="custom-checkbox">
                  <Check size={13} />
                </span>
                {text}
              </label>
            ))}
          </div>
        </section>
        <section>
          <h3>
            <ShoppingBasket size={18} /> La compra, a un paseo
          </h3>
          <p>Distancias a supermercados reales de OpenStreetMap.</p>
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
                  onClick={() => update("marketDistance", km)}
                >
                  {km === 0
                    ? "Sin límite"
                    : km < 1
                      ? "Menos de 500 m"
                      : `Menos de ${km} km`}
                </button>
              ))}
            </div>
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
            if (draft.minPrice < 0 || draft.maxPrice < draft.minPrice) {
              setError("El precio máximo debe ser igual o superior al mínimo.");
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
