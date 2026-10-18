# CERCA

Web responsive para encontrar hoteles reales y supermercados próximos en España, con diseño inspirado en Airbnb, Booking e iOS.

**Web:** https://pablo06casta.github.io/PABLO-APP/

## Datos reales y límites

El catálogo incluido contiene **2.322 hoteles reales de España** con nombre, coordenadas e identificador de Booking obtenidos de Wikidata, bajo CC0, el 18 de octubre de 2026. No se generan hoteles a partir de plantillas ni se desplazan alojamientos ficticios a la localidad buscada. El catálogo tiene cobertura limitada, puede contener información antigua y no representa la oferta completa ni confirma que un establecimiento siga operando.

Cada tarjeta abre Booking con ese hotel y las fechas y huéspedes seleccionados. Cuando Wikidata publica la ruta del hotel (P3607), se utiliza esa ficha. Cuando publica su ID numérico (P10532), se abre una búsqueda de Booking con `dest_type=hotel`, `dest_id` y `highlighted_hotels` para seleccionar ese establecimiento. La plataforma puede mostrar alternativas si no tiene disponibilidad. No se inventan rutas a partir del nombre.

**Los precios, disponibilidad, capacidad, reseñas, servicios y cancelación deben comprobarse en Booking.** No se muestran tarifas o valoraciones simuladas ni filtros que dependan de datos no disponibles. No hay integración de reserva ni API comercial de inventario en tiempo real. La interfaz permite consultar hoteles por proximidad y supermercados, guardar favoritos y comparar tres opciones.

Las fotografías disponibles corresponden al establecimiento según Wikidata/Commons e incluyen autor, licencia y enlace de atribución. Si no existe una foto libre comprobada o falla la descarga, aparece un recuadro con «Fotografía no disponible», sin sustituirla por una habitación genérica. Nueve fotografías de hoteles de Granada se sirven con la app; sus fuentes y licencias están en `public/stays/NOTICE.json`. Las demás fotografías se cargan desde Wikimedia.

## Supermercados

La consulta utiliza OpenStreetMap/Overpass, con un límite corto de espera. Si Overpass está saturado, recurre a la API oficial de lectura de OSM en una ventana de unos 560 × 450 m (varía con la latitud) alrededor del punto elegido. Si se supera el límite de nodos, reduce el área una vez. Esta alternativa es local, no cubre toda la localidad; la interfaz lo identifica. Incluye supermercados y pequeñas tiendas de alimentación (`shop=supermarket|convenience`).

Se validan coordenadas, se interpretan edificios mediante sus nodos y se eliminan duplicados cercanos. Los errores parciales no se tratan como búsquedas vacías. Hay caché en memoria durante una hora y opción de reconsulta; los resultados vacíos no se cachean. Las consultas de la ficha usan las coordenadas del **hotel**, no el centro municipal. Las consultas anteriores se cancelan al cambiar de destino.

Si ambos servicios fallan en el centro de Granada, se puede usar una copia real de 23 comercios obtenida de OSM el 18 de octubre de 2026. La app la identifica como copia guardada que no se ha podido actualizar. Fuera de esa cobertura muestra el error y permite reintentar, sin inventar comercios. La copia procede de la API oficial, área `-3.602,37.172,-3.594,37.180`, licencia ODbL, atribución © OpenStreetMap contributors.

Las distancias son geográficas en línea recta y los minutos a pie son estimaciones. «Cómo llegar» abre Google Maps con las coordenadas del comercio. Los horarios pueden estar incompletos o desactualizados.

## Desarrollo

Node.js 24.19.0 (ver `.nvmrc`) y npm 11:

```sh
cd /workspace/PABLO-APP
npm ci --cache /tmp/pablo-app-npm-cache
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

No se necesitan claves privadas para el catálogo abierto y las consultas públicas. Utiliza el checkout existente: cada tarea en la nube ya está aislada y no necesita worktrees. Los procesos deben arrancarse de nuevo en cada máquina aunque se restauren las dependencias.

```sh
npm run check       # Lint, 24 pruebas, tipos, build y smoke HTTP/PWA.
npm run test:watch
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Las pruebas de proveedores usan respuestas controladas para comprobar errores, cobertura, cancelación y recuperación; no acreditan que los servidores públicos estén operativos. La validación con datos reales se realiza por separado.

El autocompletado local incluye 8.132 municipios españoles, con búsquedas sin tildes. Nominatim solo se consulta al buscar explícitamente o pedir geolocalización, mediante una cola compartida. Los centroides municipales no precisados se identifican como aproximados. Favoritos, búsquedas y tema se guardan en el navegador. La versión del almacenamiento de favoritos se ha cambiado para no volver a mostrar las antiguas tarjetas ficticias.

La PWA permite usar la interfaz, el catálogo y las fotos locales sin conexión tras la primera carga. No confirma datos de reserva sin Internet ni descarga teselas para uso offline.

## Fuentes y actualización

- Municipios y licencia: `src/data/NOTICE.md`.
- Hoteles: `src/data/real/stays.json`; identificadores y coordenadas CC0 de Wikidata.
- Fotografías: atribuciones en el catálogo y `public/stays/NOTICE.json`; cada archivo conserva su licencia de Commons.
- Comercios: `src/data/real/granada-markets.json` y API OSM/Overpass, ODbL.

Para regenerar el catálogo desde las APIs abiertas, con Python 3 y curl:

```sh
python scripts/refresh-catalogue.py
npm run check
```

El script consulta Wikidata y metadatos de licencia de Commons. Las fotos cuya licencia no pueda comprobarse se omiten. Las fotos locales y sus créditos forman una copia independiente; una actualización del catálogo no reasigna sus atribuciones. No se hace scraping de Booking o Airbnb ni se guardan credenciales privadas en el navegador.

Para precios e inventario en tiempo real sería necesaria una API autorizada y un backend que gestione sus credenciales; el catálogo abierto no sustituye ese servicio.

## Red y publicación

Instalación: `registry.npmjs.org`. En ejecución: `nominatim.openstreetmap.org`, `overpass-api.de`, `api.openstreetmap.org`, `tile.openstreetmap.org`, `thumb.wikimedia.org`, `upload.wikimedia.org` y `commons.wikimedia.org`. Los enlaces externos abren Booking y Google Maps. La actualización del catálogo usa además `query.wikidata.org`.

Los servicios públicos tienen límites y no ofrecen un SLA para producción. Con tráfico significativo, utiliza un backend con caché, límites globales y un proveedor con capacidad contratada. La alternativa de lectura OSM está limitada a consultas locales explícitas, sin descargas masivas ni precarga de ciudades.

El workflow `.github/workflows/ci.yml` ejecuta comprobaciones, compila para `/PABLO-APP/` y publica mediante GitHub Actions en Pages. Para probar esa ruta:

```sh
CERCA_BASE_PATH=/PABLO-APP/ npm run build -- --outDir /tmp/cerca-pages-dist
CERCA_BASE_PATH=/PABLO-APP/ npm run preview -- --outDir /tmp/cerca-pages-dist --host 127.0.0.1 --port 5181 --strictPort
```
