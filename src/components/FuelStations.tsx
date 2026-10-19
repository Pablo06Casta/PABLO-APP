import { Clock3, ExternalLink, Fuel, LoaderCircle, Navigation, RefreshCw } from "lucide-react";
import type { FuelStation, Town } from "../types";
import { distance, formatDistance } from "../lib/search";
import { fuelDirectionsUrl } from "../services/places";

export function FuelStations({ stations, origin, status, error, onLoad }: {
  stations: FuelStation[];
  origin: Pick<Town, "lat" | "lng">;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onLoad: () => void;
}) {
  const sorted = stations.map((station) => ({ ...station, straightDistance: distance(origin, station) })).sort((a, b) => a.straightDistance - b.straightDistance);
  const showResults = status === "success" || (status === "loading" && sorted.length > 0);
  const mapsSearch = `https://www.google.com/maps/search/gasolineras/@${origin.lat},${origin.lng},14z`;
  return <div className="markets-panel">
    <p className="market-attribution">La consulta de OpenStreetMap envía las coordenadas del pabellón solo al buscar. Los enlaces de Google Maps envían el origen y destino cuando los abres. No cargamos mapas automáticamente.</p>
    {showResults && sorted.length > 0 && <div className="markets-toolbar"><strong>{sorted.length} gasolineras encontradas</strong><button className="secondary-button" onClick={onLoad} disabled={status === "loading"}><RefreshCw size={16} /> Actualizar gasolineras</button></div>}
    {status === "idle" && <div className="market-empty"><span className="empty-icon"><Fuel size={28} /></span><h3>Gasolineras cerca del pabellón</h3><p>Consulta establecimientos de OpenStreetMap en torno a la sede elegida.</p><button className="primary-button" onClick={onLoad}><Fuel size={17} /> Buscar gasolineras</button></div>}
    {status === "loading" && <div className="market-loading" role="status"><LoaderCircle size={22} className="spin" /><p>{sorted.length ? "Actualizando la lista…" : "Buscando gasolineras cercanas…"}</p></div>}
    {status === "success" && error && <p className="market-refresh-note" role="status">{error}</p>}
    {status === "error" && <div className="market-empty"><Fuel size={28} /><h3>No hemos podido cargar las gasolineras</h3><p>{error || "Comprueba tu conexión y vuelve a intentarlo."}</p><button className="secondary-button" onClick={onLoad}><RefreshCw size={16} /> Volver a intentar</button></div>}
    {status === "success" && !sorted.length && <div className="market-empty"><Fuel size={28} /><h3>No encontramos gasolineras en el área consultada</h3><p>OpenStreetMap puede tener cobertura incompleta. Prueba una búsqueda más amplia.</p><button className="secondary-button" onClick={onLoad}>Volver a consultar</button></div>}
    {(status === "error" || (status === "success" && !sorted.length)) && <p className="fuel-external-link"><a className="text-button" href={mapsSearch} target="_blank" rel="noreferrer">Buscar en Google Maps <ExternalLink size={14} /></a></p>}
    {showResults && sorted.map((station) => <article className="market-card fuel-card" key={station.id}>
      <span className="market-logo"><Fuel size={23} /></span>
      <div className="market-info"><h4>{station.name}</h4><p>{station.address}</p><span><Navigation size={12} /> {formatDistance(station.straightDistance)} en línea recta</span>{station.hours && <small><Clock3 size={12} /> {station.hours}</small>}<a className="market-source" href={station.sourceUrl} target="_blank" rel="noreferrer">Ver en OpenStreetMap <ExternalLink size={11} /></a></div>
      <a className="directions-button fuel-route" href={fuelDirectionsUrl(origin, station)} target="_blank" rel="noreferrer" aria-label={`Ver ruta en coche a ${station.name}`}><Navigation size={16} /><span>Ruta en coche</span></a>
    </article>)}
    {showResults && sorted.length > 0 && <p className="market-attribution">Datos © OpenStreetMap contributors (ODbL), consultados el {sorted[0].retrievedAt}. {sorted[0].coverage === "local" ? "Cobertura local limitada." : "Radio de hasta 5 km."} Distancias en línea recta; Google Maps calcula la ruta al abrir el enlace. Consulta allí horarios, precios y disponibilidad.</p>}
  </div>;
}
