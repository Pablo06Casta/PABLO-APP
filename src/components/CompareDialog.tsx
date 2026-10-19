import { Heart } from "lucide-react";
import type { Search, Stay } from "../types";
import {
  distance,
  formatDistance,
  money,
  stayPlatformUrl,
} from "../lib/search";
import { estimateStay } from "../lib/estimates";
import { searchOrigin } from "../data/venues";
import { Dialog } from "./Dialog";
import { PhotoCredit, StayPhoto } from "./StayPhoto";
type Selection = { stay: Stay; search: Search };
export function CompareDialog({
  selections,
  onClose,
  onOpen,
  remove,
  onTrip,
}: {
  selections: Selection[];
  onClose: () => void;
  onOpen: (selection: Selection) => void;
  remove: (id: string) => void;
  onTrip: () => void;
}) {
  return (
    <Dialog title="¿Con cuál te quedas?" onClose={onClose} wide>
      <div className="compare-body">
        <p className="muted">
          Compara hasta tres alojamientos reales. Los importes son presupuestos
          orientativos por persona y noche, no ofertas confirmadas. Los eventos,
          puentes y fiestas pueden cambiar el precio. Confirma el importe para
          tus fechas en los enlaces de reserva.
        </p>
        <button className="secondary-button trip-open" onClick={onTrip}>Compartir viaje</button>
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
                <th>Precio estimado por persona/noche</th>
                {selections.map(({ stay, search }) => (
                  <td key={stay.id}>
                    <strong>
                      ≈ {money(estimateStay(stay, search).perPersonNight)}
                    </strong>
                    <br />
                    <small>
                      ≈ {money(estimateStay(stay, search).totalGroup)} por el
                      grupo · sin extras
                    </small>
                    <br />
                    <a
                      href={stayPlatformUrl(stay, search)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {stay.bookingSearch ? "Buscar en" : "Ver en"}{" "}
                      {stay.platform ?? "Booking"}
                    </a>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Distancia al pabellón</th>
                {selections.map(({ stay, search }) => (
                  <td key={stay.id}>
                    {formatDistance(distance(stay, searchOrigin(search)))}
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
                      {stay.platform === "Airbnb"
                        ? "Inside Airbnb"
                        : (stay.sourceName ?? "Wikidata")}{" "}
                      · {stay.observedAt ?? stay.retrievedAt}
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
