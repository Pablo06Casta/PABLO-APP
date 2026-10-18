import { Check, Heart, Minus } from "lucide-react";
import type { Search, Stay } from "../types";
import { distance, formatDistance, money, totalPrice } from "../lib/search";
import { Dialog } from "./Dialog";
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
          Compara hasta tres alojamientos. Todos los importes y datos de esta
          tabla son de demostración.
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
                    <img
                      src={entry.stay.images[0]}
                      alt="Fotografía ilustrativa"
                    />
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
                <th>Precio por noche</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>{money(stay.nightly)}</td>
                ))}
              </tr>
              <tr className="comparison-total">
                <th>Total de la estancia</th>
                {selections.map(({ stay, search }) => (
                  <td key={stay.id}>{money(totalPrice(stay, search))}</td>
                ))}
              </tr>
              <tr>
                <th>Valoración simulada</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>{stay.rating.toFixed(2)} / 5</td>
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
                <th>Huéspedes</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>Hasta {stay.capacity}</td>
                ))}
              </tr>
              {["Cocina", "Aparcamiento", "Wifi"].map((amenity) => (
                <tr key={amenity}>
                  <th>{amenity}</th>
                  {selections.map(({ stay }) => (
                    <td key={stay.id}>
                      {stay.amenities.includes(amenity) ? (
                        <Check aria-label="Sí" size={19} />
                      ) : (
                        <Minus aria-label="No" size={19} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th>Cancelación gratuita</th>
                {selections.map(({ stay }) => (
                  <td key={stay.id}>
                    {stay.freeCancellation ? "Sí (ejemplo)" : "No"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {selections.length === 0 && (
          <p className="empty-text">
            No quedan alojamientos en la comparación.
          </p>
        )}
      </div>
    </Dialog>
  );
}
