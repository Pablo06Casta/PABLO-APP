import {
  Clock3,
  ExternalLink,
  Fuel,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
} from "lucide-react";
import type { FuelStation, Town } from "../types";
import { distance, formatDistance } from "../lib/search";
import { fuelDirectionsUrl } from "../services/places";
import references from "../data/real/fuel-references.json";

type StoredFuelReference = {
  destination: string;
  name: string;
  address: string;
  venueHint?: string;
  lat?: number;
  lng?: number;
  sourceUrl?: string;
  sourceName?: string;
  retrievedAt?: string;
  hours?: string;
  gasoline95?: number;
  dieselA?: number;
  priceAt?: string;
};

const storedReferences = references as {
  providedAt: string;
  priceComparator: string;
  stations: StoredFuelReference[];
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

function fuelReferenceMapsUrl(name: string, address: string) {
  const url = new URL("https://www.google.com/maps/search/");
  url.search = new URLSearchParams({
    api: "1",
    query: `${name}, ${address}`,
  }).toString();
  return url.toString();
}

export function FuelStations({
  stations,
  origin,
  destination,
  venueName,
  liveSearchAvailable = true,
  status,
  error,
  onLoad,
}: {
  stations: FuelStation[];
  origin: Pick<Town, "lat" | "lng">;
  destination?: string;
  venueName?: string;
  liveSearchAvailable?: boolean;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onLoad: () => void;
}) {
  const sorted = stations
    .map((station) => ({
      ...station,
      straightDistance: distance(origin, station),
    }))
    .sort((a, b) => a.straightDistance - b.straightDistance);
  const showResults =
    status === "success" || (status === "loading" && sorted.length > 0);
  const mapsSearch = `https://www.google.com/maps/search/gasolineras/@${origin.lat},${origin.lng},14z`;
  const saved = storedReferences.stations
    .filter((station) => {
      if (!destination || normalize(station.destination) !== normalize(destination))
        return false;
      if (!station.venueHint || !venueName)
        return true;
      return normalize(venueName).includes(normalize(station.venueHint));
    })
    .sort((first, second) => {
      const firstDistance = Number.isFinite(first.lat) && Number.isFinite(first.lng)
        ? distance(origin, { lat: first.lat!, lng: first.lng! })
        : Number.POSITIVE_INFINITY;
      const secondDistance = Number.isFinite(second.lat) && Number.isFinite(second.lng)
        ? distance(origin, { lat: second.lat!, lng: second.lng! })
        : Number.POSITIVE_INFINITY;
      return firstDistance - secondDistance;
    });

  return (
    <div className="markets-panel">
      <section className="fuel-price-compare" aria-label="Comparar precios de combustible">
        <div>
          <strong>Compara el precio antes de repostar</strong>
          <p>OCU muestra precios de carburante publicados para elegir estación.</p>
        </div>
        <a
          className="primary-button"
          href={storedReferences.priceComparator}
          target="_blank"
          rel="noreferrer"
        >
          Comparar precios <ExternalLink size={15} />
        </a>
      </section>

      {saved.length > 0 && (
        <section className="fuel-saved" aria-labelledby="saved-fuel-title">
          <div className="fuel-saved-heading">
            <div>
              <h3 id="saved-fuel-title">Gasolineras guardadas en {destination}</h3>
              <p>
                Direcciones aportadas al proyecto. Comprueba en el mapa la ruta,
                la distancia y que la estación siga abierta.
              </p>
            </div>
            <span>{saved.length} opciones</span>
          </div>
          {saved.map((station, index) => {
            const hasCoordinates =
              Number.isFinite(station.lat) && Number.isFinite(station.lng);
            const storedDistance = hasCoordinates
              ? distance(origin, { lat: station.lat!, lng: station.lng! })
              : null;
            return (
              <article
                className="market-card fuel-reference-card"
                key={`${station.destination}-${station.name}-${station.address}-${index}`}
              >
                <span className="market-logo"><Fuel size={23} /></span>
                <div className="market-info">
                  <h4>{station.name}</h4>
                  <p>{station.address}</p>
                  {storedDistance !== null ? (
                    <span><Navigation size={12} /> {formatDistance(storedDistance)} en línea recta</span>
                  ) : station.venueHint ? (
                    <span><MapPin size={12} /> Referencia: {station.venueHint}</span>
                  ) : null}
                  {station.hours && <small><Clock3 size={12} /> {station.hours}</small>}
                  {(station.gasoline95 || station.dieselA) && (
                    <small>
                      Precio publicado {station.priceAt ?? storedReferences.providedAt}:
                      {station.gasoline95 ? ` gasolina 95 ${station.gasoline95.toFixed(3).replace(".", ",")} €/l` : ""}
                      {station.gasoline95 && station.dieselA ? " ·" : ""}
                      {station.dieselA ? ` gasóleo A ${station.dieselA.toFixed(3).replace(".", ",")} €/l` : ""}
                    </small>
                  )}
                  {station.sourceUrl && (
                    <a className="market-source" href={station.sourceUrl} target="_blank" rel="noreferrer">
                      {station.sourceName ? "Ver fuente oficial" : "Ver en OpenStreetMap"} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <a
                  className="directions-button fuel-route"
                  href={hasCoordinates
                    ? fuelDirectionsUrl(origin, {
                        id: station.sourceUrl ?? station.name,
                        name: station.name,
                        address: station.address,
                        lat: station.lat!,
                        lng: station.lng!,
                        sourceUrl: station.sourceUrl ?? "",
                        retrievedAt: station.retrievedAt ?? storedReferences.providedAt,
                        coverage: "local",
                      })
                    : fuelReferenceMapsUrl(station.name, station.address)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${hasCoordinates ? "Ver ruta en coche a" : "Ver ubicación de"} ${station.name}, ${station.address}`}
                >
                  <Navigation size={16} /><span>{hasCoordinates ? "Ruta en coche" : "Ver ubicación"}</span>
                </a>
              </article>
            );
          })}
          <p className="market-attribution">
            Lista actualizada el {storedReferences.providedAt}. Las entradas con
            coordenadas se ordenan por distancia. Los precios fechados son una
            referencia publicada y pueden haber cambiado; compruébalos antes de repostar.
          </p>
        </section>
      )}

      {liveSearchAvailable ? (
        <>
          <p className="market-attribution fuel-live-note">
            La consulta de OpenStreetMap envía las coordenadas del pabellón solo
            al buscar. Los enlaces de Google Maps envían el origen y destino
            cuando los abres. No cargamos mapas automáticamente.
          </p>
          {showResults && sorted.length > 0 && (
            <div className="markets-toolbar">
              <strong>{sorted.length} gasolineras encontradas en OpenStreetMap</strong>
              <button className="secondary-button" onClick={onLoad} disabled={status === "loading"}>
                <RefreshCw size={16} /> Actualizar gasolineras
              </button>
            </div>
          )}
          {status === "idle" && (
            <div className="market-empty fuel-live-search">
              <span className="empty-icon"><Fuel size={28} /></span>
              <h3>Buscar más cerca del pabellón</h3>
              <p>Consulta ahora OpenStreetMap en torno a la sede elegida.</p>
              <button className="primary-button" onClick={onLoad}>
                <Fuel size={17} /> Buscar gasolineras
              </button>
            </div>
          )}
          {status === "loading" && (
            <div className="market-loading" role="status">
              <LoaderCircle size={22} className="spin" />
              <p>{sorted.length ? "Actualizando la lista…" : "Buscando gasolineras cercanas…"}</p>
            </div>
          )}
          {status === "success" && error && <p className="market-refresh-note" role="status">{error}</p>}
          {status === "error" && (
            <div className="market-empty">
              <Fuel size={28} />
              <h3>No hemos podido cargar las gasolineras</h3>
              <p>{error || "Comprueba tu conexión y vuelve a intentarlo."}</p>
              <button className="secondary-button" onClick={onLoad}><RefreshCw size={16} /> Volver a intentar</button>
            </div>
          )}
          {status === "success" && !sorted.length && (
            <div className="market-empty">
              <Fuel size={28} />
              <h3>No encontramos gasolineras en el área consultada</h3>
              <p>OpenStreetMap puede tener cobertura incompleta. Prueba una búsqueda más amplia.</p>
              <button className="secondary-button" onClick={onLoad}>Volver a consultar</button>
            </div>
          )}
          {(status === "error" || (status === "success" && !sorted.length)) && (
            <p className="fuel-external-link">
              <a className="text-button" href={mapsSearch} target="_blank" rel="noreferrer">
                Buscar en Google Maps <ExternalLink size={14} />
              </a>
            </p>
          )}
          {showResults && sorted.map((station) => (
            <article className="market-card fuel-card" key={station.id}>
              <span className="market-logo"><Fuel size={23} /></span>
              <div className="market-info">
                <h4>{station.name}</h4>
                <p>{station.address}</p>
                <span><Navigation size={12} /> {formatDistance(station.straightDistance)} en línea recta</span>
                {station.hours && <small><Clock3 size={12} /> {station.hours}</small>}
                <a className="market-source" href={station.sourceUrl} target="_blank" rel="noreferrer">
                  Ver en OpenStreetMap <ExternalLink size={11} />
                </a>
              </div>
              <a
                className="directions-button fuel-route"
                href={fuelDirectionsUrl(origin, station)}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ver ruta en coche a ${station.name}`}
              >
                <Navigation size={16} /><span>Ruta en coche</span>
              </a>
            </article>
          ))}
          {showResults && sorted.length > 0 && (
            <p className="market-attribution">
              Datos © OpenStreetMap contributors (ODbL), consultados el {sorted[0].retrievedAt}.{" "}
              {sorted[0].coverage === "local" ? "Cobertura local limitada." : "Radio de hasta 5 km."}{" "}
              Distancias en línea recta; Google Maps calcula la ruta al abrir el enlace.
              Consulta allí horarios, precios y disponibilidad.
            </p>
          )}
        </>
      ) : (
        <p className="market-refresh-note fuel-location-pending">
          La ubicación exacta de este pabellón sigue pendiente. Puedes consultar
          las direcciones guardadas y el comparador, pero no ordenarlas por
          distancia al recinto.
        </p>
      )}
    </div>
  );
}
