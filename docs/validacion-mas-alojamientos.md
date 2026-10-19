# Ampliación de alojamientos · 19 de octubre de 2026

Se incorporaron 189 alojamientos reales de OpenStreetMap (ODbL 1.0), seleccionados alrededor de las sedes confirmadas. Se conservaron las 2.323 fichas con ID/ruta de Booking de Wikidata y los 198 anuncios de Inside Airbnb. Ningún precio nuevo se presenta como tarifa observada.

Cinco de los nuevos alojamientos tienen ruta de Booking publicada en su web enlazada desde OSM. Los otros 184 ofrecen «Buscar en Booking», con nombre, ubicación, fechas y huéspedes. No son fichas verificadas de esa plataforma. El conector de Booking no estaba disponible; no se simuló una consulta ni se incorporaron datasets comerciales de licencia incierta.

## Cobertura hasta 10 km de alguna sede confirmada de la ciudad

Estas cifras cuentan alojamientos antes de aplicar presupuesto, radio elegido, tipo, fechas o capacidad. No son disponibilidad confirmada; tampoco se suman los anuncios de Airbnb en esta tabla.

| Ciudad | Fichas de Booking previas | Alojamientos añadidos | Total hoteles y otros alojamientos |
| --- | ---: | ---: | ---: |
| Granollers | 3 | 1 | 4 |
| Solares | 1 | 7 | 8 |
| Santander | 6 | 16 | 22 |
| Vitoria-Gasteiz | 5 | 24 | 29 |
| A Estrada | 0 | 1 | 1 |
| Alicante | 19 | 32 | 51 |
| Benalmádena | 32 | 26 | 58 |
| Cartagena | 3 | 6 | 9 |
| Estella-Lizarra | 2 | 9 | 11 |
| Huelva | 6 | 4 | 10 |
| La Rinconada | 10 | 4 | 14 |
| Paracuellos de Jarama | 23 | 15 | 38 |
| Oviedo | 19 | 44 | 63 |

## Validación realizada

- `npm run check`: lint, 37 pruebas en cinco archivos, TypeScript, compilación y smoke HTTP/PWA completados sin fallos.
- Nuevas pruebas cubren ampliación por sede, filtros Booking/radio, ausencia de duplicados por ID, búsquedas por nombre sin identificadores inventados, parámetros de fechas/grupo y la ruta publicada del Hotel Don Luis.
- Chromium sobre la compilación: Aldabe muestra 40 opciones iniciales (24 para consultar en Booking y 16 de Airbnb) con precio estimado ascendente. Se abre una búsqueda de hotel con nombre y coordenadas, y el detalle la identifica expresamente como búsqueda sin ficha verificada.
- Filtro Booking y cambio a Palacio de Deportes de Santander: 21 tarjetas dentro del presupuesto/radio inicial. Gran Hotel Sardinero abre `/hotel/es/gran-hotel-sardinero.html` con fechas y grupo; su detalle muestra la página fuente del enlace.
- Resoluciones 320, 375, 390, 768, 1024 y 1440 px sin desbordamiento ni errores JavaScript. Capturas actualizadas en `vista-escritorio.png` y `vista-movil.png`.
- El navegador transmitió respuestas HTTPS reales con el proxy y la CA del entorno. No se desactivó TLS ni se usaron fixtures de red para acreditar estas comprobaciones.

No se han verificado tarifas, disponibilidad actual, condiciones de acceso ni permanencia de cada establecimiento. El catálogo puede contener información desactualizada. Las 19 exclusiones revisadas se documentan en `src/data/real/osm-stays-exclusions.json`. Se mantienen las cuatro sedes pendientes sin recomendaciones de cercanía.
