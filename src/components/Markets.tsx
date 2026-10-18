import {
  Clock3,
  ExternalLink,
  LoaderCircle,
  Navigation,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
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
  const sorted = markets
    .map((market) => ({ ...market, distance: distance(origin, market) }))
    .sort((a, b) => a.distance - b.distance);
  const visible = limit ? sorted.slice(0, limit) : sorted;
  return (
    <div className="markets-panel">
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
          <p>Buscando supermercados reales cerca de ti…</p>
          {[1, 2, 3].map((n) => (
            <div className="market-skeleton skeleton" key={n} />
          ))}
        </div>
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
          <h3>No hay supermercados registrados cerca</h3>
          <p>
            OpenStreetMap puede no tener todos los establecimientos de esta
            zona.
          </p>
          <button className="secondary-button" onClick={onLoad}>
            Volver a consultar
          </button>
        </div>
      )}
      {status === "success" &&
        visible.map((market) => (
          <article className="market-card" key={market.id}>
            <span className="market-logo">
              <ShoppingBasket size={23} />
            </span>
            <div className="market-info">
              <h4>{market.name}</h4>
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
      {status === "success" && (
        <p className="market-attribution">
          Datos © OpenStreetMap contributors. Distancias en línea recta y
          tiempos a pie aproximados, no rutas calculadas. Los horarios pueden
          cambiar.
        </p>
      )}
    </div>
  );
}
