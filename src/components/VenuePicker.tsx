import { ArrowUpRight, MapPin, Trophy } from "lucide-react";
import { venues, venueDirections } from "../data/venues";
import type { Search, Venue } from "../types";
export function VenuePicker({
  search,
  onSelect,
}: {
  search: Search;
  onSelect: (venue: Venue) => void;
}) {
  const cities = [...new Set(venues.map((v) => v.city))];
  return (
    <section className="venue-picker" aria-label="Pabellones de bádminton">
      <div className="venue-picker-heading">
        <span className="venue-sport">
          <Trophy size={16} /> VIAJES DE BÁDMINTON
        </span>
        <span>
          {venues.length} instalaciones · {cities.length} destinos
        </span>
      </div>
      <label htmlFor="venue-select">
        <MapPin size={18} /> Tu pabellón de competición
      </label>
      <select
        id="venue-select"
        value={search.venue?.id ?? ""}
        onChange={(event) => {
          const venue = venues.find((v) => v.id === event.target.value);
          if (venue) onSelect(venue);
        }}
      >
        <option value="" disabled>
          Selecciona un pabellón de la lista
        </option>
        {cities.map((city) => (
          <optgroup label={city} key={city}>
            {venues
              .filter((v) => v.city === city)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.location ? "" : " · ubicación por confirmar"}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {search.venue ? (
        <div
          className={`venue-selected ${search.venue.location ? "" : "venue-pending"}`}
        >
          <div>
            <strong>
              {search.venue.city} · {search.venue.name}
            </strong>
            <p>
              {search.venue.location
                ? "Alojamientos y supermercados calculados desde este pabellón."
                : "La ubicación de esta instalación necesita confirmación. No mostramos distancias ni recomendaciones de proximidad hasta verificarla."}
            </p>
          </div>
          <a href={venueDirections(search)} target="_blank" rel="noreferrer">
            Ver ubicación <ArrowUpRight size={15} />
          </a>
        </div>
      ) : (
        <p className="muted">
          Elige un pabellón para buscar alrededor de la instalación, en lugar
          del centro de la ciudad.
        </p>
      )}
    </section>
  );
}
