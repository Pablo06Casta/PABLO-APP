# CERCA

Aplicación web responsive para explorar alojamientos económicos y supermercados próximos en España. Diseño inspirado en iOS, Airbnb y Booking: blanco, azul suave, tarjetas con fotografías, navegación inferior en móvil y modo claro/oscuro.

## Qué funciona

- Autocompletado local de un catálogo de 8.132 municipios españoles; búsquedas sin tildes, fechas y entre 1 y 8 huéspedes.
- Búsqueda explícita en Nominatim para precisar centros o buscar localidades adicionales. Nunca se utiliza Nominatim para autocompletar mientras se escribe.
- Ocho alojamientos **ficticios** por destino en modo demostración. Filtros por precio, tipo, distancia, puntuación, cancelación, cocina y aparcamiento.
- Orden por precio total de estancia (incluida limpieza simulada), distancia o valoración.
- Galería, detalle, desglose, favoritos persistentes, destinos recientes y comparación de hasta tres alojamientos.
- Enlaces a búsquedas de Booking y Airbnb con destino, fechas y huéspedes. No representan fichas de los alojamientos ficticios.
- Mapa Leaflet/OpenStreetMap con marcadores de precio demo, centro y supermercados reales.
- Consulta de supermercados de OpenStreetMap/Overpass: nombre, dirección registrada, horario disponible, proximidad, tiempo a pie estimado y ruta en Google Maps. No se generan establecimientos inventados cuando falla el proveedor.
- PWA con manifiesto, iconos de instalación, service worker, interfaz y catálogo disponibles sin conexión tras la primera carga. Los servicios en tiempo real necesitan Internet.
- Privacidad local, geolocalización solo a petición y con autorización del navegador, gestión de datos locales y soporte de movimiento reducido.

## Transparencia de los datos

**Este MVP no tiene acceso a precios, disponibilidad ni valoraciones reales de Booking o Airbnb.** Todos los alojamientos, servicios, reseñas, importes y ubicaciones de alojamiento son demostraciones claramente identificadas; las fotografías son ilustrativas. No se confirma disponibilidad ni se permite reservar esos ejemplos.

Los supermercados sí se obtienen de OpenStreetMap. Sus distancias son geográficas en línea recta y los minutos a pie son estimaciones, no rutas peatonales calculadas. Los horarios pueden estar incompletos o desactualizados. El punto municipal del catálogo es un centroide: CERCA conserva centros urbanos conocidos e intenta precisar el resto con Nominatim al buscar. Si no se puede, muestra una advertencia sobre la referencia aproximada.

## Desarrollo

Node.js 24.19.0 (ver `.nvmrc`) y npm 11:

```sh
cd /workspace/PABLO-APP
npm ci --cache /tmp/pablo-app-npm-cache
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

No hacen falta claves privadas para el modo demo y los proveedores públicos. Cada tarea en la nube está aislada; utiliza el checkout existente sin crear worktrees adicionales. Los procesos deben arrancarse de nuevo en cada máquina aunque se restauren las dependencias.

```sh
npm run check       # Análisis, 20 pruebas, tipos, compilación y smoke HTTP/PWA.
npm run test:watch  # Pruebas durante el desarrollo.
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

La prueba HTTP inicia y cierra su propio servidor en un puerto libre. Las pruebas de proveedores utilizan respuestas controladas y no acreditan acceso a los servicios externos. La validación visual y funcional se realiza por separado con Chromium.

## Red y servicios

La instalación descarga dependencias desde `registry.npmjs.org`. En ejecución:

| Servicio | Dominio | Uso |
| --- | --- | --- |
| Nominatim | nominatim.openstreetmap.org | Búsqueda explícita y geolocalización inversa |
| Overpass | overpass-api.de | Supermercados registrados en OpenStreetMap |
| OpenStreetMap | tile.openstreetmap.org | Teselas del mapa |
| Booking y Airbnb | booking.com, airbnb.es | Búsquedas externas, al pulsar sus enlaces |
| Google Maps | google.com | Rutas, al pulsar «Cómo llegar» |

Las fotos y la tipografía están alojadas con la app. Si una red restringe los proveedores, el catálogo local, los alojamientos demo y las funciones locales siguen funcionando; la app explica los fallos y ofrece reintentar. Las llamadas fallidas no se sustituyen por supermercados simulados.

Nominatim tiene cola de consultas y caché de sesión. Para tráfico de producción se debe usar un servicio autorizado con capacidad suficiente o un backend con caché y límites globales, de acuerdo con su política de uso. No se descargan teselas para uso offline.

## Publicación web

El workflow `.github/workflows/ci.yml` comprueba el proyecto y genera un artefacto de GitHub Pages con la ruta `/PABLO-APP/`.

Para habilitar la publicación por primera vez, el administrador del repositorio debe seleccionar **Settings → Pages → Source: GitHub Actions** y guardar. Después debe ejecutar o repetir el workflow **Comprobar y publicar CERCA**. El workflow distingue una publicación completada de una activación pendiente; compilar el artefacto no publica por sí solo la web.

El dominio previsto es `pablo06casta.github.io`, bajo la ruta del repositorio. No debe considerarse publicado hasta que el despliegue termine y se compruebe la URL.

Para probar la compilación con esa ruta en otro directorio:

```sh
CERCA_BASE_PATH=/PABLO-APP/ npm run build -- --outDir /tmp/cerca-pages-dist
CERCA_BASE_PATH=/PABLO-APP/ npm run preview -- --outDir /tmp/cerca-pages-dist --host 127.0.0.1 --port 5181 --strictPort
```

## Arquitectura y proveedores futuros

- `src/components/`: buscador, tarjetas, filtros, mapa, supermercados, detalle y comparación.
- `src/data/`: catálogo municipal y su aviso de licencia.
- `src/lib/`: precios, filtros, distancias y persistencia.
- `src/services/lodging.ts`: contrato `LodgingProvider` y proveedor demo.
- `src/services/places.ts`: adaptadores Nominatim y Overpass.
- `src/types.ts`: modelos de datos compartidos.
- `scripts/smoke.mjs`: comprobación de recursos compilados e instalación PWA.

Se conserva React + TypeScript + Vite del proyecto existente para este MVP estático y desplegable. Para conectar alojamientos reales hace falta un acuerdo/API oficial o proveedor autorizado y un backend que gestione credenciales, disponibilidad, precios totales y fichas reales. No se incluye scraping ni credenciales en el cliente. Cambiar un nombre de plataforma no convierte el proveedor demo en uno real.

Fotografías ilustrativas: ver `public/images/NOTICE.txt`. Catálogo: ver `src/data/NOTICE.md`. Tipografía Inter y paquetes instalados conservan sus licencias.
