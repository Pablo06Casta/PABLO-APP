import { useState } from "react";
import { RotateCcw, ShoppingBasket } from "lucide-react";
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
  return (
    <Dialog title="Encuentra tu lugar ideal" onClose={onClose}>
      <div className="filter-body">
        <section>
          <h3>Distancia al centro</h3>
          <label>
            Distancia máxima al centro{" "}
            <select
              value={draft.maxDistance}
              onChange={(event) =>
                setDraft({ ...draft, maxDistance: Number(event.target.value) })
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
          <h3>Precio y condiciones</h3>
          <p>
            El catálogo abierto no incluye tarifas, valoraciones, capacidad ni
            cancelación verificadas. Consulta estos datos en Booking con tus
            fechas y número de huéspedes.
          </p>
        </section>
        <section>
          <h3>
            <ShoppingBasket size={18} /> La compra, a un paseo
          </h3>
          <p>
            Supermercados y tiendas de alimentación reales de OpenStreetMap.
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
      </div>
      <div className="dialog-footer">
        <button
          className="text-button"
          onClick={() => setDraft({ ...initialFilters })}
        >
          <RotateCcw size={15} /> Restablecer
        </button>
        <button className="primary-button" onClick={() => onApply(draft)}>
          Aplicar filtros
        </button>
      </div>
    </Dialog>
  );
}
