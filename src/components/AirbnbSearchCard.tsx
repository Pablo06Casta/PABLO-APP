import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";
import type { Search } from "../types";
import { bookingUrl, nights } from "../lib/search";
import { venueLabel } from "../data/venues";

const readableDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
};

export function AirbnbSearchCard({
  search,
  onCompare,
}: {
  search: Search;
  onCompare?: () => void;
}) {
  return (
    <aside className="airbnb-search-card" aria-label={`Alojamientos en Airbnb para ${search.town.name}`}>
      <div className="airbnb-search-card-top">
        <span className="airbnb-external-badge">AIRBNB · BÚSQUEDA EXTERNA</span>
        <ArrowUpRight size={20} aria-hidden="true" />
      </div>
      <div>
        <h3>Alojamientos en Airbnb cerca de {venueLabel(search)}</h3>
        <p>Consulta en Airbnb sus anuncios disponibles y el precio final para este viaje.</p>
      </div>
      <dl className="airbnb-search-details">
        <div><dt><MapPin size={15} /> Zona</dt><dd>{search.town.name}</dd></div>
        <div><dt><CalendarDays size={15} /> Fechas</dt><dd>{readableDate(search.checkIn)}–{readableDate(search.checkOut)} · {nights(search)} noches</dd></div>
        <div><dt><Users size={15} /> Viajeros</dt><dd>{search.guests} {search.guests === 1 ? "huésped" : "huéspedes"}</dd></div>
      </dl>
      <a className="airbnb-search-action" href={bookingUrl(search, "Airbnb")} target="_blank" rel="noreferrer">
        Ver alojamientos en Airbnb <ArrowUpRight size={16} />
      </a>
      {onCompare && (
        <button className="airbnb-compare-action" onClick={onCompare}>
          Comparar un Airbnb con Booking
        </button>
      )}
      <small>Airbnb abre en una pestaña nueva. CERCA no copia ni verifica sus anuncios y no está afiliada.</small>
    </aside>
  );
}
