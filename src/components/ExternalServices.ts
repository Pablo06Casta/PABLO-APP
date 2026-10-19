import { createContext } from "react";

// Opciones en memoria: cada visita empieza sin cargar fotos ni mapas externos.
export const ExternalServices = createContext({
  photos: false,
  setPhotos: (_value: boolean) => {},
  maps: false,
  setMaps: (_value: boolean) => {},
});
