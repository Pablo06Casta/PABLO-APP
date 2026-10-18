import { useState } from "react";
import {
  ArrowUpRight,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  MapPin,
  ShoppingBasket,
  Star,
  Users,
  Utensils,
  Wifi,
} from "lucide-react";
import type { Market, Search, Stay } from "../types";
import {
  bookingUrl,
  distance,
  formatDistance,
  money,
  nights,
  totalPrice,
} from "../lib/search";
import { Dialog } from "./Dialog";
import { Markets } from "./Markets";
import { LazyMap as MapView } from "./LazyMap";
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
  const [photo, setPhoto] = useState(0);
  return (
    <Dialog title={stay.name} onClose={onClose} wide>
      <div className="detail-content">
        <div className="detail-gallery">
          <img
            className="gallery-main"
            src={stay.images[photo]}
            alt={`Imagen ilustrativa ${photo + 1} de ${stay.name}`}
          />
          <span className="gallery-demo">Fotografías ilustrativas · demo</span>
          <button
            className="gallery-prev icon-button"
            aria-label="Foto anterior"
            onClick={() =>
              setPhoto((photo + stay.images.length - 1) % stay.images.length)
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="gallery-next icon-button"
            aria-label="Siguiente foto"
            onClick={() => setPhoto((photo + 1) % stay.images.length)}
          >
            <ChevronRight size={20} />
          </button>
          <span className="gallery-count">
            {photo + 1} / {stay.images.length}
          </span>
        </div>
        <div className="detail-title">
          <div>
            <span className="small-caps">
              {stay.type} EN {search.town.name}
            </span>
            <h2>Un lugar para sentirte en casa.</h2>
            <p className="detail-rating">
              <Star size={15} fill="currentColor" />
              {stay.rating.toFixed(2)} · {stay.reviews} reseñas simuladas{" "}
              <span>·</span>
              <Users size={15} />
              Hasta {stay.capacity} huéspedes
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
            <strong>Este alojamiento es ficticio.</strong> Fotografías,
            ubicación, reseñas, servicios y precios son ejemplos de
            demostración. Consulta los resultados y la disponibilidad real en
            Booking o Airbnb.
          </p>
        </div>
        <div className="detail-columns">
          <div>
            <section className="detail-section">
              <h3>Todo lo que necesitas</h3>
              <p className="detail-description">
                Un ejemplo de estancia para explorar CERCA: descubre la zona,
                guarda tus lugares preferidos y comprueba qué tienes cerca antes
                de organizar tu escapada.
              </p>
              <div className="amenities-grid">
                {stay.amenities.map((amenity) => (
                  <span key={amenity}>
                    {amenity === "Wifi" ? (
                      <Wifi size={18} />
                    ) : amenity === "Cocina" ? (
                      <Utensils size={18} />
                    ) : amenity === "Aparcamiento" ? (
                      <CarFront size={18} />
                    ) : (
                      <Check size={18} />
                    )}{" "}
                    {amenity}
                  </span>
                ))}
              </div>
              {stay.freeCancellation && (
                <p className="cancellation">
                  <Check size={16} /> Cancelación gratuita · condición de
                  ejemplo
                </p>
              )}
            </section>
            <section className="detail-section">
              <h3>
                <MapPin size={20} /> Tu ubicación
              </h3>
              <p>
                {formatDistance(distance(stay, search.town))} del centro ·{" "}
                {stay.address}
              </p>
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
              <strong>{money(stay.nightly)}</strong> / noche <span>DEMO</span>
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
            <div className="price-line">
              <span>
                {money(stay.nightly)} × {nights(search)} noches
              </span>
              <span>{money(stay.nightly * nights(search))}</span>
            </div>
            <div className="price-line">
              <span>Limpieza (simulada)</span>
              <span>{money(stay.cleaningFee)}</span>
            </div>
            <div className="price-total">
              <strong>Total demo</strong>
              <strong>{money(totalPrice(stay, search))}</strong>
            </div>
            <p className="price-note">
              Importes ficticios. Los impuestos y cargos reales los determina la
              plataforma al reservar.
            </p>
            <a
              className="primary-button platform-link"
              href={bookingUrl(search, "Booking")}
              target="_blank"
              rel="noreferrer"
            >
              Buscar en Booking <ArrowUpRight size={17} />
            </a>
            <a
              className="secondary-button platform-link"
              href={bookingUrl(search, "Airbnb")}
              target="_blank"
              rel="noreferrer"
            >
              Buscar en Airbnb <ArrowUpRight size={17} />
            </a>
            <small className="external-note">
              Abrirás una búsqueda real con tus fechas y huéspedes, no una ficha
              de este ejemplo.
            </small>
          </aside>
        </div>
        <section className="detail-section">
          <div className="section-title-row">
            <div>
              <h3>
                <ShoppingBasket size={21} /> Supermercados cerca
              </h3>
              <p>Los tres más próximos a la ubicación ilustrativa.</p>
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
