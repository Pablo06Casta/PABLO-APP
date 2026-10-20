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
import { routeUrl } from "../lib/routes";
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
            confirmada y puede cambiar. Al cambiar las fechas, los eventos,
            torneos, puentes y fiestas pueden cambiar el precio y la
            disponibilidad. Consulta el precio para tus fechas mediante el
            enlace a {stay.platform ?? "Booking"}. Confirma impuestos, cargos y
            cancelación en {stay.platform ?? "Booking"} antes de reservar.
          </p>
        </div>
        <div className="detail-columns">
          <div>
            <section className="detail-section">
              <h3>Para tu viaje de bádminton</h3>
              <p>
                {stay.bookingSearch
                    ? `${stay.sourceName === "OpenStreetMap" ? "Alojamiento localizado en OpenStreetMap." : "Alojamiento incorporado por nombre y dirección pública; su punto en el mapa es aproximado."} El enlace busca su nombre y ubicación en Booking; confirma que el resultado corresponde al hotel antes de reservar. No se ha verificado una ficha ni disponibilidad en Booking. El presupuesto usa el modelo de planificación indicado.`
                    : `Alojamiento con identificador o enlace publicado de Booking. Fuente: ${stay.sourceName ?? "Wikidata"}. El enlace no confirma que la ficha siga activa ni disponibilidad. No hay tarifa observada de este hotel: el presupuesto usa el modelo propio de CERCA.`}
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
              {stay.sourceName === "OpenStreetMap" && (
                <small>
                  © OpenStreetMap contributors ·{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ODbL 1.0
                  </a>
                  {" · "}Consulta: {stay.retrievedAt}. Las condiciones y el
                  estado del alojamiento pueden cambiar.
                </small>
              )}
              {stay.bookingSourceUrl && (
                <a
                  className="text-button"
                  href={stay.bookingSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fuente del enlace de Booking <ArrowUpRight size={15} />
                </a>
              )}
            </section>
            <section className="detail-section">
              <h3>
                <MapPin size={20} /> Tu pabellón y alojamiento
              </h3>
              <p>{venueLabel(search)} · {formatDistance(distance(stay, origin))} en línea recta. No es la distancia de la ruta.</p>
              {search.venue?.status !== "pending" && search.venue?.location ? <>
                <p>Al abrir un trayecto, se enviarán a Google Maps las coordenadas del alojamiento y del pabellón. CERCA no carga la ruta ni calcula duración o distancia por carretera. Consulta esos datos en Google Maps.</p>
                {stay.approximateLocation && <p>El origen del alojamiento es aproximado; confirma la dirección exacta antes de viajar.</p>}
                <div className="trip-actions">{([ ["walking", "Andando"], ["driving", "En coche"], ["transit", "Transporte público"] ] as const).map(([mode, label]) => <a key={mode} className="secondary-button" href={routeUrl(stay, search, mode)!} target="_blank" rel="noreferrer">{label} · Google Maps <ArrowUpRight size={15} /></a>)}</div>
              </> : <p role="status">No hay rutas: falta confirmar las coordenadas del pabellón.</p>}
              {search.venue?.status !== "pending" && search.venue?.location && <MapView stays={[stay]} search={search} markets={markets} onOpen={() => {}} compact />}
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
                {stay.bookingSearch
                  ? "Buscar este alojamiento en"
                  : "Ver este alojamiento en"}{" "}
                {stay.platform ?? "Booking"} <ArrowUpRight size={17} />
              </a>
            )}
            <small className="external-note">
              {stay.platform === "Airbnb"
                ? "Enlace a la ficha del anuncio de Airbnb."
                : stay.bookingSearch
                  ? "Búsqueda por nombre y ubicación; puede devolver otros hoteles."
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
