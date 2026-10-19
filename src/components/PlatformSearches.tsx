import { ArrowUpRight } from "lucide-react";
import { bookingUrl } from "../lib/search";
import { venueLabel } from "../data/venues";
import type { Search } from "../types";
export function PlatformSearches({ search }: { search: Search }) {
  if (search.venue && !search.venue.location) return null;
  return (
    <section
      className="platform-searches"
      aria-label="Ampliar búsqueda en plataformas"
    >
      <div>
        <strong>Amplía las opciones cerca de {venueLabel(search)}</strong>
        <p>
          CERCA no está afiliada a estas plataformas. Estas búsquedas externas no son ofertas
          confirmadas. Conservan tus fechas, grupo y zona.
        </p>
        <p className="event-price-notice">
          Al cambiar las fechas, los eventos, torneos, puentes y fiestas pueden
          cambiar el precio y la disponibilidad. Consulta el precio para tus
          fechas mediante el enlace a Booking.
        </p>
      </div>
      <a href={bookingUrl(search, "Booking")} target="_blank" rel="noreferrer">
        Consultar precios en Booking <ArrowUpRight size={15} />
      </a>
      <a href={bookingUrl(search, "Airbnb")} target="_blank" rel="noreferrer">
        Buscar en Airbnb <ArrowUpRight size={15} />
      </a>
    </section>
  );
}
