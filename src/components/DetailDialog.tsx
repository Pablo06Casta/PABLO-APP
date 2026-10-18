import {
  ArrowUpRight,
  Heart,
  Info,
  MapPin,
  ShoppingBasket,
  Users,
} from "lucide-react";
import type { Market, Search, Stay } from "../types";
import { distance, formatDistance, stayBookingUrl } from "../lib/search";
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
  const booking = stayBookingUrl(stay, search);
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
              {stay.type} · {search.town.name}
            </span>
            <h2>{stay.name}</h2>
            <p className="detail-rating">
              <MapPin size={15} />
              {formatDistance(distance(stay, search.town))} del centro
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
            <strong>Alojamiento real del catálogo abierto.</strong> No hay
            tarifas, reseñas ni disponibilidad en tiempo real en CERCA.
            Comprueba las condiciones y la capacidad para tu grupo en Booking.
          </p>
        </div>
        <div className="detail-columns">
          <div>
            <section className="detail-section">
              <h3>Información del alojamiento</h3>
              <p className="detail-description">
                Nombre, coordenadas e identificador de Booking procedentes de
                Wikidata. Catálogo consultado el {stay.retrievedAt}. La
                información puede cambiar.
              </p>
              <a
                className="text-button"
                href={stay.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver fuente del alojamiento <ArrowUpRight size={15} />
              </a>
              <p>
                Servicios, condiciones de cancelación y valoraciones: consultar
                en la plataforma.
              </p>
            </section>
            <section className="detail-section">
              <h3>
                <MapPin size={20} /> Ubicación registrada
              </h3>
              <p>{stay.address}</p>
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
              <strong>Consulta tu estancia</strong>
            </div>
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
            <p className="price-note">
              Precio, impuestos y disponibilidad se comprueban en Booking para
              tus fechas.
            </p>
            {booking && (
              <a
                className="primary-button platform-link"
                href={booking}
                target="_blank"
                rel="noreferrer"
              >
                Ver este hotel en Booking <ArrowUpRight size={17} />
              </a>
            )}
            <small className="external-note">
              {stay.bookingPath
                ? "Enlace a la ficha de este hotel."
                : "Se abre Booking con este hotel seleccionado mediante su identificador."}{" "}
              Tus fechas y huéspedes se incluyen en el enlace.
            </small>
          </aside>
        </div>
        <section className="detail-section">
          <div className="section-title-row">
            <div>
              <h3>
                <ShoppingBasket size={21} /> Supermercados cerca
              </h3>
              <p>Consulta alrededor de las coordenadas de este alojamiento.</p>
            </div>
          </div>
          <Markets
            markets={markets}
            origin={stay}
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
