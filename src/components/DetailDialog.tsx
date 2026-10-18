import {
  ArrowUpRight,
  Heart,
  Info,
  MapPin,
  ShoppingBasket,
  Users,
} from "lucide-react";
import type { Market, Search, Stay } from "../types";
import {
  distance,
  formatDistance,
  money,
  stayPlatformUrl,
} from "../lib/search";
import { estimateStay } from "../lib/estimates";
import { searchOrigin, venueLabel } from "../data/venues";
import { Dialog } from "./Dialog";
import { Markets } from "./Markets";
import { LazyMap as MapView } from "./LazyMap";
import { PhotoCredit, StayPhoto } from "./StayPhoto";
export function DetailDialog({
  stay,
  search,
  saved,
  onFavorite,
  onClose,
  markets,
  marketStatus,
  marketError,
  loadMarkets,
}: {
  stay: Stay;
  search: Search;
  saved: boolean;
  onFavorite: () => void;
  onClose: () => void;
  markets: Market[];
  marketStatus: string;
  marketError: string;
  loadMarkets: () => void;
}) {
  const origin = searchOrigin(search),
    link = stayPlatformUrl(stay, search),
    estimate = estimateStay(stay, search);
  const route = `https://www.google.com/maps/dir/?api=1&origin=${stay.lat},${stay.lng}&destination=${origin.lat},${origin.lng}&travelmode=walking`;
  return (
    <Dialog title={stay.name} onClose={onClose} wide>
      <div className="detail-content">
        <div className="detail-gallery">
          <StayPhoto stay={stay} className="gallery-main" />
        </div>
        <PhotoCredit stay={stay} />
        <div className="detail-title">
          <div>
            <span className="small-caps">
              {stay.type} · {stay.platform ?? "Booking"} · {search.town.name}
            </span>
            <h2>{stay.name}</h2>
            <p className="detail-rating">
              <MapPin size={15} />
              {stay.approximateLocation ? "≈ " : ""}
              {formatDistance(distance(stay, origin))} de {venueLabel(search)}
            </p>
          </div>
          <button
            className={`detail-save icon-button ${saved ? "blue" : ""}`}
            onClick={onFavorite}
            aria-label={saved ? "Quitar de favoritos" : "Guardar alojamiento"}
            aria-pressed={saved}
          >
            <Heart fill={saved ? "currentColor" : "none"} size={23} />
          </button>
        </div>
        <div className="demo-disclaimer">
          <Info size={19} />
          <p>
            <strong>Alojamiento real, presupuesto estimado.</strong> El precio
            mostrado orienta la planificación del viaje; no es una oferta
            confirmada y puede cambiar. Confirma disponibilidad, impuestos,
            cargos y cancelación en {stay.platform ?? "Booking"} antes de
            reservar.
          </p>
        </div>
        <div className="detail-columns">
          <div>
            <section className="detail-section">
              <h3>Para tu viaje de bádminton</h3>
              <p>
                {stay.platform === "Airbnb"
                  ? `Anuncio de Airbnb recopilado por Inside Airbnb. Tarifa de referencia observada el ${stay.observedAt}. La localización publicada es aproximada; la dirección exacta se confirma en la plataforma.`
                  : `Identidad e identificador de Booking del catálogo Wikidata. No hay tarifa observada de este hotel: el presupuesto usa el modelo de planificación indicado.`}
              </p>
              <p>
                {stay.capacity
                  ? `Capacidad publicada: ${stay.capacity} huéspedes. `
                  : `Para ${search.guests} personas se presuponen ${estimate.rooms} habitaciones dobles. Debes confirmar capacidad y número de camas. `}
                {stay.minimumNights
                  ? `Estancia mínima publicada: ${stay.minimumNights} noche(s).`
                  : "Condiciones de estancia: confirmar en la plataforma."}
              </p>
              {stay.amenities.length > 0 && (
                <p>
                  Servicios publicados en el catálogo:{" "}
                  {stay.amenities.join(" · ")}. Pueden haber cambiado.
                </p>
              )}
              <a
                className="text-button"
                href={stay.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver fuente del alojamiento <ArrowUpRight size={15} />
              </a>
              {stay.platform === "Airbnb" && (
                <small>
                  Datos: Inside Airbnb ·{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 4.0
                  </a>
                  . Selección y estimaciones elaboradas por CERCA.
                </small>
              )}
            </section>
            <section className="detail-section">
              <h3>
                <MapPin size={20} /> Tu pabellón y alojamiento
              </h3>
              <p>
                {venueLabel(search)} · distancias aproximadas en línea recta.
              </p>
              <a
                className="text-button"
                href={route}
                target="_blank"
                rel="noreferrer"
              >
                Ruta al pabellón
                {stay.approximateLocation ? " desde la zona aproximada" : ""}{" "}
                <ArrowUpRight size={15} />
              </a>
              <MapView
                stays={[stay]}
                search={search}
                markets={markets}
                onOpen={() => {}}
                compact
              />
            </section>
          </div>
          <aside className="price-breakdown">
            <div className="detail-nightly">
              <strong>≈ {money(estimate.perPersonNight)}</strong>
              <small> / persona y noche</small>
            </div>
            <p className="estimate-range">
              Rango orientativo: {money(estimate.low)}–{money(estimate.high)}
            </p>
            <div className="booking-summary">
              <div>
                <small>ENTRADA</small>
                <strong>
                  {new Date(search.checkIn + "T12:00:00").toLocaleDateString(
                    "es-ES",
                  )}
                </strong>
              </div>
              <div>
                <small>SALIDA</small>
                <strong>
                  {new Date(search.checkOut + "T12:00:00").toLocaleDateString(
                    "es-ES",
                  )}
                </strong>
              </div>
              <p>
                <Users size={14} />
                {search.guests} huéspedes
              </p>
            </div>
            <div className="price-total">
              <span>Presupuesto del grupo</span>
              <strong>≈ {money(estimate.totalGroup)}</strong>
            </div>
            <p className="price-note">
              Estimación para toda la estancia, sin cargos adicionales ni
              impuestos no publicados. No confirma una reserva.
            </p>
            <details className="estimate-method">
              <summary>Cómo se ha estimado</summary>
              <p>{estimate.explanation}</p>
              <p>
                El rango usa −30 % y +40 % sobre la estimación central por
                persona; es orientativo, sin garantía estadística. En hoteles
                con el mismo modelo, el desempate es la distancia al pabellón,
                no una tarifa real más barata.
              </p>
            </details>
            {link && (
              <a
                className="primary-button platform-link"
                href={link}
                target="_blank"
                rel="noreferrer"
              >
                Ver este alojamiento en {stay.platform ?? "Booking"}{" "}
                <ArrowUpRight size={17} />
              </a>
            )}
            <small className="external-note">
              {stay.platform === "Airbnb"
                ? "Enlace a la ficha del anuncio de Airbnb."
                : stay.bookingPath
                  ? "Enlace a la ficha publicada de Booking."
                  : "Booking selecciona este hotel mediante su identificador."}{" "}
              Se incluyen las fechas y huéspedes.
            </small>
          </aside>
        </div>
        <section className="detail-section">
          <div className="section-title-row">
            <div>
              <h3>
                <ShoppingBasket size={21} /> Supermercados junto al pabellón
              </h3>
              <p>
                Ordenados desde {venueLabel(search)}, no desde el centro de la
                ciudad.
              </p>
            </div>
          </div>
          <Markets
            markets={markets}
            origin={origin}
            status={marketStatus}
            error={marketError}
            onLoad={loadMarkets}
            limit={3}
          />
        </section>
      </div>
    </Dialog>
  );
}
