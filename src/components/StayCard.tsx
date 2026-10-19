import {
  ArrowUpRight,
  Check,
  Heart,
  MapPin,
  ShoppingBasket,
  SlidersHorizontal,
} from "lucide-react";
import type { Market, Search, Stay } from "../types";
import {
  distance,
  formatDistance,
  money,
  nearestMarkets,
  nights,
  stayPlatformUrl,
} from "../lib/search";
import { estimateStay } from "../lib/estimates";
import { searchOrigin } from "../data/venues";
import { PhotoCredit, StayPhoto } from "./StayPhoto";
export function StayCard({
  stay,
  search,
  markets,
  saved,
  compared,
  onFavorite,
  onCompare,
  onOpen,
}: {
  stay: Stay;
  search: Search;
  markets: Market[];
  saved: boolean;
  compared: boolean;
  onFavorite: () => void;
  onCompare: () => void;
  onOpen: () => void;
}) {
  const origin = searchOrigin(search);
  const closest = nearestMarkets(origin, markets)[0];
  const link = stayPlatformUrl(stay, search);
  const estimate = estimateStay(stay, search);
  return (
    <article
      className="stay-card"
      data-estimate={estimate.perPersonNight}
      data-platform={stay.platform ?? "Booking"}
      data-booking-search={Boolean(stay.bookingSearch)}
    >
      <div className="card-photo">
        <button
          className="photo-open"
          onClick={onOpen}
          aria-label={`Ver ${stay.name}`}
        >
          <StayPhoto stay={stay} />
        </button>
        <span className="photo-badge">{stay.type}</span>
        <button
          className={`favorite-button ${saved ? "is-saved" : ""}`}
          onClick={onFavorite}
          aria-label={`${saved ? "Quitar de" : "Guardar en"} favoritos: ${stay.name}`}
          aria-pressed={saved}
        >
          <Heart size={20} fill={saved ? "currentColor" : "none"} />
        </button>
        <span className={`real-badge platform-${stay.platform?.toLowerCase()}`}>
          {stay.bookingSearch
            ? "Alojamiento real · buscar en Booking"
            : `${stay.platform ?? "Booking"} · enlace publicado`}
        </span>
      </div>
      <PhotoCredit stay={stay} />
      <div className="card-heading">
        <button onClick={onOpen}>{stay.name}</button>
      </div>
      <p className="card-location">
        <MapPin size={13} />
        {stay.approximateLocation ? "≈ " : ""}
        {formatDistance(distance(stay, origin))} del{" "}
        {search.venue ? "pabellón" : "centro"} · {search.town.name}
      </p>
      <p className="card-amenities">
        {stay.capacity
          ? `Hasta ${stay.capacity} huéspedes según el catálogo`
          : `Plan: ${estimate.rooms} habitación(es) doble(s); confirmar capacidad`}
      </p>
      {stay.minimumNights && (
        <p className="card-amenities">
          Estancia mínima publicada: {stay.minimumNights} noche(s)
        </p>
      )}
      <p className={`card-market ${closest ? "" : "market-pending"}`}>
        <ShoppingBasket size={14} />
        {closest
          ? `Compra a ${formatDistance(closest.distance)} del ${search.venue ? "pabellón" : "centro"}`
          : `Consulta la compra cerca del ${search.venue ? "pabellón" : "centro"}`}
      </p>
      <div className="card-bottom">
        <div>
          <p className="card-price">
            <strong>≈ {money(estimate.perPersonNight)}</strong>
            <span> / persona y noche</span>
          </p>
          <p className="card-total">
            Rango orientativo {money(estimate.low)}–{money(estimate.high)}
          </p>
          <p className="card-total">
            ≈ {money(estimate.totalGroup)} / grupo · {nights(search)} noches ·
            sin extras
          </p>
        </div>
        <button
          className="card-open"
          onClick={onOpen}
          aria-label={`Detalles de ${stay.name}`}
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
      <p className="estimate-source">
        {estimate.source === "historical"
          ? `Referencia histórica · ${stay.observedAt}`
          : "Estimación de CERCA · tarifa no observada"}
      </p>
      <p className="card-total event-price-notice">
        Eventos, puentes y fiestas pueden cambiar el precio. Confírmalo para tus
        fechas en {stay.platform ?? "Booking"}.
      </p>
      {link && (
        <a
          className="card-booking-link"
          href={link}
          target="_blank"
          rel="noreferrer"
          aria-label={`${stay.bookingSearch ? "Buscar" : "Ver"} ${stay.name} en ${stay.platform ?? "Booking"}`}
        >
          {stay.bookingSearch ? "Buscar en" : "Ver en"}{" "}
          {stay.platform ?? "Booking"}
          <ArrowUpRight size={15} />
        </a>
      )}
      <button
        className={`compare-add ${compared ? "is-compared" : ""}`}
        onClick={onCompare}
        aria-pressed={compared}
      >
        {compared ? <Check size={12} /> : <SlidersHorizontal size={12} />}
        {compared ? "En tu comparación" : "Comparar"}
      </button>
    </article>
  );
}
