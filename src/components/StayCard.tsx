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
  nearestMarkets,
  stayBookingUrl,
} from "../lib/search";
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
  const closest = nearestMarkets(stay, markets)[0];
  const booking = stayBookingUrl(stay, search);
  return (
    <article className="stay-card">
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
        <span className="real-badge">Alojamiento real</span>
      </div>
      <PhotoCredit stay={stay} />
      <div className="card-heading">
        <button onClick={onOpen}>{stay.name}</button>
      </div>
      <p className="card-location">
        <MapPin size={13} />
        {search.town.name} · {formatDistance(distance(stay, search.town))} del
        centro
      </p>
      <p className="card-amenities">
        Fechas y {search.guests} huéspedes: confirmar en Booking
      </p>
      <p className={`card-market ${closest ? "" : "market-pending"}`}>
        <ShoppingBasket size={14} />
        {closest
          ? `Tienda de alimentación a ${formatDistance(closest.distance)}`
          : "Consulta supermercados cerca"}
      </p>
      <div className="card-bottom">
        <div>
          <p className="card-price">
            <strong>Consultar precio</strong>
          </p>
          <p className="card-total">Disponibilidad en la plataforma</p>
        </div>
        <button
          className="card-open"
          onClick={onOpen}
          aria-label={`Detalles de ${stay.name}`}
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
      {booking && (
        <a
          className="card-booking-link"
          href={booking}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ver ${stay.name} en Booking`}
        >
          Ver en Booking <ArrowUpRight size={15} />
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
