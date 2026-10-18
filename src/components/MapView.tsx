import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowUpRight,
  LocateFixed,
  MapPin,
  ShoppingBasket,
  X,
} from "lucide-react";
import type { Market, Search, Stay } from "../types";
import { money } from "../lib/search";
export function MapView({
  stays,
  search,
  markets,
  onOpen,
  compact = false,
}: {
  stays: Stay[];
  search: Search;
  markets: Market[];
  onOpen: (stay: Stay) => void;
  compact?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const [selected, setSelected] = useState<Stay | null>(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    setTileError(false);
    const map = L.map(container.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([search.town.lat, search.town.lng], compact ? 14 : 13);
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      },
    ).addTo(map);
    tilesRef.current = tiles;
    tiles.on("tileerror", () => setTileError(true));
    layerRef.current = L.layerGroup().addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tilesRef.current = null;
    };
  }, [compact, search.town]);
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    map.setView([search.town.lat, search.town.lng], compact ? 14 : 13);
    setSelected(null);
    L.circleMarker([search.town.lat, search.town.lng], {
      radius: 7,
      color: "#fff",
      weight: 3,
      fillColor: "#3969df",
      fillOpacity: 1,
    })
      .addTo(layer)
      .bindTooltip(
        `${search.town.approximate ? "Referencia aproximada de" : "Centro de"} ${search.town.name}`,
        { direction: "top" },
      );
    for (const stay of stays) {
      const marker = L.marker([stay.lat, stay.lng], {
        title: stay.name,
        keyboard: true,
        icon: L.divIcon({
          className: "stay-marker-wrapper",
          html: `<span class="stay-map-marker">${money(stay.nightly)}</span>`,
          iconSize: [68, 35],
          iconAnchor: [34, 17],
        }),
      }).addTo(layer);
      marker.on("click", () => setSelected(stay));
    }
    for (const market of markets) {
      const marker = L.marker([market.lat, market.lng], {
        title: market.name,
        icon: L.divIcon({
          className: "market-marker-wrapper",
          html: '<span class="market-map-marker"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h16l-2 11H6L4 9ZM8 9l4-7 4 7M9 12v5m6-5v5"/></svg></span>',
          iconSize: [28, 28],
        }),
      }).addTo(layer);
      const popup = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = market.name;
      const address = document.createElement("p");
      address.textContent = market.address;
      popup.append(name, address);
      marker.bindPopup(popup);
    }
  }, [stays, markets, search.town, compact]);
  return (
    <div className={`map-shell ${compact ? "map-compact" : ""}`}>
      <div
        ref={container}
        className="leaflet-map"
        role="region"
        aria-label={`Mapa de alojamientos y supermercados en ${search.town.name}`}
      />
      <div className="map-legend">
        <span>
          <i /> Alojamientos demo
        </span>
        <span>
          <ShoppingBasket size={14} /> Supermercados reales
        </span>
      </div>
      <button
        className="map-locate icon-button"
        aria-label="Centrar mapa en la localidad"
        onClick={() =>
          mapRef.current?.setView(
            [search.town.lat, search.town.lng],
            compact ? 14 : 13,
          )
        }
      >
        <LocateFixed size={20} />
      </button>
      {tileError && (
        <p className="map-error">
          El fondo del mapa no está disponible. Los marcadores conservan sus
          coordenadas.
          <button
            onClick={() => {
              setTileError(false);
              tilesRef.current?.redraw();
            }}
          >
            Reintentar mapa
          </button>
        </p>
      )}
      {selected && (
        <div className="map-selected">
          <img src={selected.images[0]} alt="Fotografía ilustrativa" />
          <div>
            <strong>{selected.name}</strong>
            <p>
              <MapPin size={12} /> {search.town.name} · ejemplo ficticio
            </p>
            <b>
              {money(selected.nightly)} <small>/ noche demo</small>
            </b>
          </div>
          <button
            className="icon-button"
            onClick={() => onOpen(selected)}
            aria-label="Ver detalles del alojamiento del mapa"
          >
            <ArrowUpRight size={20} />
          </button>
          <button
            className="map-selected-close"
            aria-label="Cerrar tarjeta del mapa"
            onClick={() => setSelected(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
