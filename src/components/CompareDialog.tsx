import { Heart } from "lucide-react";
import type { Search, Stay } from "../types";
import { distance, formatDistance, stayBookingUrl } from "../lib/search";
import { Dialog } from "./Dialog";
import { PhotoCredit, StayPhoto } from "./StayPhoto";
type Selection = { stay: Stay; search: Search };
export function CompareDialog({
  selections,
  onClose,
  onOpen,
  remove,
}: {
  selections: Selection[];
  onClose: () => void;
  onOpen: (selection: Selection) => void;
  remove: (id: string) => void;
}) {
  return (
    <Dialog title="¿Con cuál te quedas?" onClose={onClose} wide>
      <div className="compare-body">
        <p className="muted">
          Compara hasta tres hoteles reales. Las tarifas y condiciones se
          consultan en Booking.
        </p>
        <div className="compare-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>
                  <Heart size={23} />
                  <span>
                    Tus opciones,
                    <br />
                    de un vistazo.
                  </span>
                </th>
                {selections.map((entry) => (
                  <th key={entry.stay.id}>
                    <StayPhoto stay={entry.stay} />
                    <PhotoCredit stay={entry.stay} />
                    <button onClick={() => onOpen(entry)}>
                      {entry.stay.name}
                    </button>
                    <small>{entry.search.town.name}</small>
                    <button
                      className="compare-remove"
                      onClick={() => remove(entry.stay.id)}
                    >
                      Quitar
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Precio y disponibilidad</th>
                {selections.map(({ stay, search }) => (
                  <td key={stay.id}>
                    <a
                      href={stayBookingUrl(stay, search)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Consultar en Booking
                    </a>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Distancia al centro</th>
                {selections.map(({ stay, search }) => (
                  <td key={stay.id}>
                    {formatDistance(distance(stay, search.town))}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Servicios y cancelación</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>Confirmar en la plataforma</td>
                ))}
              </tr>
              <tr>
                <th>Fuente</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>
                    <a href={stay.sourceUrl} target="_blank" rel="noreferrer">
                      Wikidata · {stay.retrievedAt}
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {!selections.length && (
          <p className="empty-text">
            No quedan alojamientos en la comparación.
          </p>
        )}
      </div>
    </Dialog>
  );
}
