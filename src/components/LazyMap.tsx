import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import type { MapView } from "./MapView";
const Map = lazy(() =>
  import("./MapView").then((module) => ({ default: module.MapView })),
);
export function LazyMap(props: ComponentProps<typeof MapView>) {
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
