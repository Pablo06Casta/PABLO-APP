import {
  Clock3,
  ExternalLink,
  LoaderCircle,
  Navigation,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
import { useState } from "react";
import type { Market, Stay, Town } from "../types";
import { distance, formatDistance } from "../lib/search";
import { mapsUrl } from "../services/places";
export function Markets({
  markets,
  origin,
  status,
  error,
  onLoad,
  limit,
}: {
  markets: Market[];
  origin: Stay | Town;
  status: string;
  error: string;
  onLoad: () => void;
  limit?: number;
}) {
  const [allFood, setAllFood] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const classified = markets.some((market) => market.kind);
  const sorted = markets
    .filter((market) => allFood || !classified || market.kind === "supermarket")
    .map((market) => ({ ...market, distance: distance(origin, market) }))
    .sort((a, b) => a.distance - b.distance);
  const visible = limit && !expanded ? sorted.slice(0, limit) : sorted;
  const dates = [
    ...new Set(markets.map((market) => market.retrievedAt).filter(Boolean)),
  ].sort();
  const dateRange =
    dates.length > 1 ? `${dates[0]} a ${dates.at(-1)}` : dates[0];
  const showResults =
    status === "success" || (status === "loading" && markets.length > 0);
  return (
    <div className="markets-panel">
      {showResults && markets.length > 0 && (
        <div className="markets-toolbar">
          <div>
            <strong>
              {limit && !expanded && sorted.length > limit
                ? `${visible.length} más cercanos de ${sorted.length} establecimientos`
                : `${sorted.length} establecimientos cercanos`}
            </strong>
            {classified && (
              <div
                className="market-kind-filters"
                role="group"
                aria-label="Tipo de comercio"
              >
                <button
                  className="secondary-button"
                  aria-pressed={!allFood}
                  onClick={() => setAllFood(false)}
                >
                  Supermercados
                </button>
                <button
                  className="secondary-button"
                  aria-pressed={allFood}
                  onClick={() => setAllFood(true)}
                >
                  Incluir tiendas de alimentación
                </button>
              </div>
            )}
          </div>
          <button
            className="secondary-button"
            onClick={onLoad}
            disabled={status === "loading"}
          >
            <RefreshCw size={16} /> Actualizar supermercados
          </button>
        </div>
      )}
      {status === "idle" && (
        <div className="market-empty">
          <span className="empty-icon">
            <ShoppingBasket size={28} />
          </span>
          <h3>Lo esencial, a un paseo</h3>
          <p>
            Consulta supermercados reales de OpenStreetMap cerca de esta
            ubicación.
          </p>
          <button className="primary-button" onClick={onLoad}>
            <ShoppingBasket size={17} /> Buscar supermercados
          </button>
        </div>
      )}
      {status === "loading" && (
        <div className="market-loading" role="status">
          <LoaderCircle size={22} className="spin" />
          <p>
            {markets.length
              ? "Actualizando; puedes seguir consultando la lista guardada…"
              : "Buscando supermercados reales cerca del punto elegido…"}
          </p>
          {!markets.length &&
            [1, 2, 3].map((n) => (
              <div className="market-skeleton skeleton" key={n} />
            ))}
        </div>
      )}
      {status === "success" && error && (
        <p className="market-refresh-note" role="status">
          {error}
        </p>
      )}
      {status === "error" && (
        <div className="market-empty">
          <span className="empty-icon">
            <ShoppingBasket size={28} />
          </span>
          <h3>No hemos podido cargar los supermercados</h3>
          <p>{error || "Comprueba tu conexión y vuelve a intentarlo."}</p>
          <button className="secondary-button" onClick={onLoad}>
            <RefreshCw size={16} /> Volver a intentar
          </button>
          <a
            className="text-button"
            href={`https://www.google.com/maps/search/supermercados/@${origin.lat},${origin.lng},15z`}
            target="_blank"
            rel="noreferrer"
          >
            Buscar en Google Maps <ExternalLink size={14} />
          </a>
        </div>
      )}
      {status === "success" && !visible.length && (
        <div className="market-empty">
          <ShoppingBasket size={30} />
          <h3>No encontramos comercios en el área consultada</h3>
          <p>
            La consulta tiene cobertura local limitada y OpenStreetMap puede no
            tener todos los establecimientos. Amplía la búsqueda en Google Maps.
          </p>
          <button className="secondary-button" onClick={onLoad}>
            Volver a consultar
          </button>
          <a
            className="text-button"
            href={`https://www.google.com/maps/search/supermercados/@${origin.lat},${origin.lng},15z`}
            target="_blank"
            rel="noreferrer"
          >
            Ampliar en Google Maps <ExternalLink size={14} />
          </a>
        </div>
      )}
      {showResults &&
        visible.map((market) => (
          <article className="market-card" key={market.id}>
            <span className="market-logo">
              <ShoppingBasket size={23} />
            </span>
            <div className="market-info">
              <h4>{market.name}</h4>
              {market.kind && (
                <small>
                  {market.kind === "supermarket"
                    ? "Supermercado"
                    : "Tienda de alimentación"}
                </small>
              )}
              <p>{market.address}</p>
              <span>
                <Navigation size={12} /> {formatDistance(market.distance)} · ~
                {Math.max(1, Math.ceil(((market.distance * 1.25) / 4.5) * 60))}{" "}
                min a pie
              </span>
              {market.hours && (
                <small>
                  <Clock3 size={12} /> {market.hours}
                </small>
              )}
              {market.sourceUrl && (
                <a
                  className="market-source"
                  href={market.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en OpenStreetMap <ExternalLink size={11} />
                </a>
              )}
            </div>
            <a
              className="directions-button"
              href={mapsUrl(market.lat, market.lng)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Cómo llegar a ${market.name}`}
            >
              <Navigation size={16} />
              <span>Cómo llegar</span>
            </a>
          </article>
        ))}
      {showResults && limit && sorted.length > limit && (
        <button
          className="secondary-button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded
            ? `Mostrar los ${limit} más cercanos`
            : `Ver los ${sorted.length} establecimientos`}
        </button>
      )}
      {showResults && markets.length > 0 && (
        <p className="market-attribution">
          {markets.some((m) => m.cached)
            ? `Incluye datos guardados de ${dateRange ?? "fecha no disponible"}. Puedes actualizarlos con el botón superior. `
            : `Datos consultados el ${dateRange ?? "fecha no disponible"}. `}
          {markets.some((m) => m.coverage === "local")
            ? "Cobertura local limitada alrededor del punto consultado; no incluye toda la localidad. "
            : "Consulta hasta 3 km alrededor del punto elegido. "}
          Datos © OpenStreetMap contributors (ODbL). Distancias en línea recta
          y tiempos a pie aproximados, no rutas calculadas. Los horarios pueden
          cambiar.
        </p>
      )}
    </div>
  );
}
