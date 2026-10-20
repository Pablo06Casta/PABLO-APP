# Bases de datos de CERCA: oferta de descarga y licencias

Publicado el 20 de octubre de 2026. Los enlaces de descarga son relativos a esta carpeta de la web.

## OpenStreetMap — ODbL 1.0

© OpenStreetMap contributors. Atribución: https://www.openstreetmap.org/copyright
Licencia íntegra: https://opendatacommons.org/licenses/odbl/1-0/

Ofrecemos gratuitamente por Internet estas bases derivadas, en JSON legible por máquina, bajo ODbL 1.0. Las fechas de cada captura permanecen en sus metadatos o registros. La fecha de este aviso no actualiza la fecha de los datos.

- `osm-stays.json`: alojamientos seleccionados hasta 10 km de sedes confirmadas; normalización de nombre/tipo/dirección, cálculo de centros de edificios, deduplicación por objeto/nombre/punto y exclusiones revisadas. Los enlaces de Booking publicados por establecimientos se identifican con su fuente; no son precios o inventario extraídos de Booking.
- `venue-markets.json`: supermercados y tiendas hasta 3 km de sedes confirmadas. Incluye fuentes, cobertura y fechas; selección de tipos, centros de edificios y deduplicación.
- `granada-markets.json`: copia anterior y limitada de comercios OSM, con fecha individual. No representa una actualización de todo el catálogo.
- `venues.json`: selección de instalaciones indicadas por el usuario, enlazadas a objetos OSM para los puntos confirmados. San Roque se identifica como punto aproximado y cuatro instalaciones sin ubicación confirmada permanecen pendientes.
- `market-exclusions.json` y `osm-stays-exclusions.json`: exclusiones documentadas de las transformaciones anteriores.

Las bases se mantienen separadas de los datos de Wikidata. La licencia de cada contenido adicional conserva su alcance propio; este aviso no concede derechos de marcas o fotos ni asegura vigencia de enlaces o establecimientos.

Métodos y fuentes de las transformaciones: https://github.com/Pablo06Casta/PABLO-APP/tree/main/scripts y https://github.com/Pablo06Casta/PABLO-APP/blob/main/src/data/real/NOTICE-badminton.md . Los archivos publicados son copias de las bases empleadas en esta compilación, no un servicio de inventario actualizado.

## Otras fuentes

- Datos estructurados de Wikidata: CC0, https://www.wikidata.org/wiki/Wikidata:Licensing . Fuente y fecha de los catálogos: https://github.com/Pablo06Casta/PABLO-APP/tree/main/src/data/real . No implica licencia sobre las fotos o páginas externas enlazadas.
- `curated-stays.json`: tres referencias públicas de alojamiento para Tudela de Duero, separadas de OSM y Wikidata. Sus coordenadas son aproximadas y sus enlaces abren búsquedas por nombre; deben confirmarse antes de viajar.
- Catálogo municipal: licencia ISC, texto íntegro en `municipalities-NOTICE.md`.
- Fotografías: cada imagen conserva autor, fuente y licencia individual, enlazados desde la tarjeta. Los créditos de las imágenes locales se conservan además en `../stays/NOTICE.json`. La fuente de una imagen no sustituye su licencia.
- Inter: OFL, texto íntegro en `../licenses/Inter-OFL.txt`.

No se publica ni se ofrece en estas descargas un catálogo de anuncios de Airbnb. Su búsqueda externa se abre únicamente al pulsar el enlace. CERCA no está afiliada a Booking.com ni a Airbnb.
