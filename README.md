# CERCA · viajes de bádminton

**Web:** https://pablo06casta.github.io/PABLO-APP/

Encuentra alojamientos reales y supermercados alrededor del **pabellón de competición**. Selecciona sede, fechas y grupo; compara presupuestos orientativos por persona y noche y abre la ficha de Booking o Airbnb para comprobar condiciones y reservar en la plataforma.

## Qué funciona

- Selector con las 23 instalaciones comunicadas por el usuario, en 15 destinos. Hay 19 puntos comprobados y cuatro pendientes, identificados sin simular cercanía.
- Alojamientos con identidad/ID de Booking de Wikidata (2.322 fichas originales y una adicional), 189 alojamientos adicionales de OpenStreetMap cerca de los pabellones y 198 anuncios reales de Airbnb de Inside Airbnb. Los cinco enlaces de Booking publicados en las webs de los nuevos hoteles abren su ficha; los otros 184 se identifican como búsquedas por nombre y ubicación, sin afirmar que estén disponibles en Booking. Cobertura limitada, no inventario completo.
- Orden inicial por **menor precio estimado por persona y noche**, con desempate por distancia al pabellón. Presupuesto inicial editable de 50 €/persona/noche.
- Filtros de presupuesto, plataforma, categoría, distancia al pabellón, capacidad/estancia mínima conocidas y servicios publicados. Nunca se confirma capacidad desconocida: los hoteles sin datos presuponen habitaciones dobles y lo indican.
- Detalle con rango orientativo, presupuesto del grupo, explicación de estimación, fuente, fechas y enlace del anuncio. En Airbnb se respetan los IDs largos como cadenas y se usan `check_in`, `check_out` y `adults`; Booking recibe hotel y habitaciones dobles previstas.
- Supermercados ordenados desde el pabellón, incluidos en el mapa junto a alojamientos y sede. Catálogo fechado de 271 supermercados y 120 tiendas de alimentación para las 19 sedes confirmadas: carga inmediata, selección de tipo y actualización explícita sin perder los resultados guardados. Los detalles cargan la compra al abrirse, desde su propia sede. Distancias en línea recta y minutos a pie aproximados, no rutas calculadas. «Cómo llegar» abre Google Maps.
- Favoritos, comparación de tres opciones, navegación móvil, modo oscuro y PWA. El autocompletado de municipios se conserva para destinos adicionales; donde no hay sede elegida se identifica el modo centro de ciudad.

## Datos y precios

**No son ofertas confirmadas.** Booking usa un modelo de planificación común por ciudad y categoría, sin observar tarifas de cada hotel; no permite afirmar cuál tiene hoy el precio real más bajo. Airbnb usa una tarifa histórica con fecha, capacidad y estancia mínima del catálogo. Los rangos no tienen garantía estadística. Los importes pueden cambiar y excluyen extras/impuestos no publicados.

Se filtra y ordena con la misma estimación central por persona y noche. Los hoteles no reciben variaciones aleatorias por nombre/ID. Para grupos impares se prevén habitaciones dobles completas. Los anuncios de Airbnb se descartan si incumplen la capacidad o estancia mínima publicadas; no se multiplican apartamentos para simular plazas adicionales.

El usuario reserva en la plataforma: CERCA no cobra ni confirma reservas. Las fichas pueden estar antiguas o retiradas. «Ver en Booking» abre una ruta publicada o selecciona un identificador conocido; «Buscar en Booking» consulta el nombre y la ubicación de un alojamiento real de OSM, pero puede devolver otros resultados. No confirma su presencia en Booking. El catálogo tiene huecos; las búsquedas externas de ambas plataformas amplían la zona con fechas y huéspedes. No se hace scraping de Booking o Airbnb ni se simula una conexión con el plugin de Booking, que no está disponible en esta sesión.

Fuentes, licencias, fechas, método y límites: [NOTICE-badminton.md](src/data/real/NOTICE-badminton.md). Datos Airbnb: Inside Airbnb, CC BY 4.0, con selección y cálculos de CERCA. Wikidata: CC0. Puntos de Airbnb aproximados; sede/tiendas: © OpenStreetMap contributors, ODbL.

Pendientes de confirmar: Aronova Badminton Center (Vitoria), Centro de Tecnificación de Madrid/Barajas y los dos pabellones de Ibiza. Los demás se pueden seleccionar sin esperar esas aclaraciones.

Las fotos libres existentes corresponden al establecimiento y muestran autor/licencia; nueve se sirven localmente con créditos en `public/stays/NOTICE.json`. No se reproducen fotos de Airbnb sin licencia. Cuando falta una foto hay un marcador explícito, sin habitaciones genéricas.

## Desarrollo y verificación

Node.js 24.19.0 (ver `.nvmrc`), npm 11:

```sh
cd /workspace/PABLO-APP
npm ci --cache /tmp/pablo-app-npm-cache
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Utiliza el checkout existente: cada tarea en la nube ya está aislada y no requiere worktrees. Si 5173 ya sirve CERCA, reutilízalo. Los procesos deben arrancarse de nuevo en cada máquina. No se necesitan claves privadas para este catálogo abierto.

```sh
npm run check       # Lint, 45 pruebas, tipos, build y smoke HTTP/PWA.
npm run test:watch
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Las pruebas de proveedores usan fixtures para comprobar fallos y recuperación y no demuestran por sí solas acceso real. Se valida por separado en navegador el selector de pabellón, enlaces a las dos plataformas, presupuesto y orden, filtros y supermercados reales.

## Servicios y publicación

La consulta inicial utiliza `venue-markets.json`, con comercios reales de OSM y fecha de consulta, hasta 3 km del pabellón. Incluye 391 comercios únicos y cobertura para las 19 sedes con coordenadas. La copia previa de Granada se conserva para búsquedas en esa zona. El botón «Actualizar supermercados» consulta Overpass y, si falla, la API oficial de lectura OSM en una ventana limitada (±0,006°, reducida a ±0,003° si falla). Una respuesta local no elimina comercios guardados fuera de esa ventana; se conserva su fecha. Si falla la actualización, la lista guardada sigue disponible. Las sedes sin coordenadas se mantienen pendientes sin simular proximidad. Hay caché en memoria de una hora; los vacíos no se cachean. Se distinguen supermercados y tiendas de alimentación y se enlaza cada nuevo registro a OSM. La cobertura es parcial y no acredita apertura, inventario o tarifas actuales.

La geolocalización es opcional y requiere acción y permiso del navegador. Nominatim solo se consulta explícitamente; el autocompletado de 8.132 municipios es local y las coordenadas municipales no precisadas se identifican como aproximadas. Las sedes seleccionadas usan sus propios puntos comprobados.

La PWA conserva interfaz, catálogo y fotos locales sin conexión tras la primera carga, sin precargar teselas. Los servicios públicos tienen límites: para tráfico significativo se necesita backend con caché y un proveedor con capacidad contratada. Una integración comercial de inventario en tiempo real requiere una API autorizada y gestión segura de credenciales fuera del cliente.

La instalación utiliza `registry.npmjs.org`. Servicios de ejecución: `nominatim.openstreetmap.org`, `overpass-api.de`, `api.openstreetmap.org`, `tile.openstreetmap.org`, `thumb.wikimedia.org` y `upload.wikimedia.org`. Los enlaces abren Booking, Airbnb, Commons, Inside Airbnb y Google Maps. La preparación de datos usa APIs públicas y descargas autorizadas de `query.wikidata.org`, `commons.wikimedia.org` y `data.insideairbnb.com`.

El workflow `.github/workflows/ci.yml` comprueba, compila para `/PABLO-APP/` y publica en GitHub Pages mediante Actions. Para probar esa ruta:

```sh
CERCA_BASE_PATH=/PABLO-APP/ npm run build -- --outDir /tmp/cerca-pages-dist
CERCA_BASE_PATH=/PABLO-APP/ npm run preview -- --outDir /tmp/cerca-pages-dist --host 127.0.0.1 --port 5181 --strictPort
```

Se conserva `scripts/refresh-catalogue.py` para el catálogo base de Wikidata y sus fotografías libres. `scripts/import-osm-hotels.py` importa exportaciones oficiales `map.json` sin datos personales de colaboradores, aplica el radio de 10 km, elimina duplicados y respeta exclusiones revisadas. No consulta Booking ni inventa rutas. La actualización de sedes/Airbnb debe conservar fuentes, fechas, licencia y criterios de `NOTICE-badminton.md` y ejecutar las comprobaciones.
