import { lazy, Suspense, useContext } from "react";
import { ExternalServices } from "./ExternalServices";
import type { ComponentProps } from "react";
import type { MapView } from "./MapView";
const Map = lazy(() =>
  import("./MapView").then((module) => ({ default: module.MapView })),
);
export function LazyMap(props: ComponentProps<typeof MapView>) {
  const { maps, setMaps } = useContext(ExternalServices);
  if (!maps)
    return (
      <div
        className={`map-shell map-privacy-gate ${props.compact ? "map-compact" : ""}`}
      >
        <strong>Mapa externo de OpenStreetMap</strong>
        <p>
          Al cargarlo, el proveedor recibirá tu IP, datos técnicos y el área
          consultada. Es opcional; puedes seguir usando la lista. Puedes
          desactivarlo en Privacidad.
        </p>
        <button className="primary-button" onClick={() => setMaps(true)}>
          Cargar mapa externo
        </button>
      </div>
    );
  return (
    <Suspense
      fallback={
        <div
          className={`map-shell skeleton ${props.compact ? "map-compact" : ""}`}
          role="status"
          aria-label="Cargando mapa"
        />
      }
    >
      <Map {...props} />
    </Suspense>
  );
}
