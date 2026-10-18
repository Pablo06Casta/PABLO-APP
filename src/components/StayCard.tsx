import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  ShoppingBasket,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { Market, Search, Stay } from "../types";
import {
  distance,
  formatDistance,
  money,
  nearestMarkets,
  nights,
  totalPrice,
} from "../lib/search";
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
  const [photo, setPhoto] = useState(0);
  const closest = nearestMarkets(stay, markets)[0];
  return (
    <article className="stay-card">
      <div className="card-photo">
        <button
          className="photo-open"
          onClick={onOpen}
          aria-label={`Ver ${stay.name}`}
        >
          <img
            src={stay.images[photo]}
            alt={`Imagen ilustrativa: ${stay.name}`}
            loading="lazy"
            width="640"
            height="480"
          />
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
        <div className="photo-arrows">
          <button
            aria-label={`Foto anterior de ${stay.name}`}
            onClick={() =>
              setPhoto((photo + stay.images.length - 1) % stay.images.length)
            }
          >
            <ChevronLeft size={17} />
          </button>
          <button
            aria-label={`Siguiente foto de ${stay.name}`}
            onClick={() => setPhoto((photo + 1) % stay.images.length)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="photo-dots" aria-hidden="true">
          {stay.images.map((_, index) => (
            <span key={index} className={index === photo ? "active" : ""} />
          ))}
        </div>
        <span className="demo-badge">DEMO</span>
      </div>
      <div className="card-heading">
        <button onClick={onOpen}>{stay.name}</button>
        <span className="rating">
          <Star size={13} fill="currentColor" />
          {stay.rating.toFixed(2).replace(".", ",")}
        </span>
      </div>
      <p className="card-location">
        <MapPin size={13} />
        {search.town.name} · {formatDistance(distance(stay, search.town))} del
        centro
      </p>
      <p className="card-amenities">
        {stay.capacity} huéspedes ·{" "}
        {stay.amenities.includes("Cocina")
          ? "Cocina"
          : stay.type === "Hotel"
            ? "Habitación privada"
            : "Wifi incluido"}
      </p>
      <p className={`card-market ${closest ? "" : "market-pending"}`}>
        <ShoppingBasket size={14} />
        {closest
          ? `Supermercado a ${formatDistance(closest.distance)}`
          : "Explora supermercados cerca"}
      </p>
      <div className="card-bottom">
        <div>
          <p className="card-price">
            <strong>{money(stay.nightly)}</strong>
            <span> / noche</span>
          </p>
          <p className="card-total">
            {money(totalPrice(stay, search))} por {nights(search)} noches ·
            precio demo
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
