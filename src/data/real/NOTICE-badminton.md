# Procedencia del catálogo de bádminton

Consulta y selección: 18 de octubre de 2026. CERCA no está afiliada a Booking ni a Airbnb.

## Instalaciones

`../venues.json` recoge las 23 instalaciones comunicadas por el usuario, en 15 destinos municipales. Las 19 ubicaciones confirmadas se contrastaron con instalaciones de OpenStreetMap; cada registro guarda su enlace al objeto OSM, dirección y fecha. Los cuatro registros sin ubicación inequívoca se mantienen como pendientes y no generan recomendaciones ni consultas de cercanía. No se reutilizan paradas de autobús, cafés o aparcabicicletas como si fueran el pabellón.

© OpenStreetMap contributors, licencia ODbL 1.0: https://www.openstreetmap.org/copyright . Las coordenadas de edificios se calcularon como centro de sus nodos cuando fue necesario; no representan necesariamente la entrada de deportistas. Estella se corresponde con la instalación rotulada «Polideportivo Lizarreria» en OSM.

Pendientes: Aronova Badminton Center (Vitoria), Centro de Tecnificación de Madrid/Barajas, Polideportivo Insular Blanca Dona y Poliesportiu des Raspallar (Ibiza). La lista no confirma que cada instalación aloje un torneo concreto: el organizador debe confirmar su sede.

## Airbnb: únicamente búsqueda externa

El 19 de octubre de 2026 se retiró el catálogo de 198 registros procedentes de Inside Airbnb. Su licencia anunciada CC BY 4.0 no acredita por sí sola todos los derechos de terceros sobre el contenido original. No se importan anuncios, tarifas, fotos, títulos, coordenadas o datos de anfitriones de Airbnb; el usuario puede abrir una búsqueda externa con su destino, fechas y grupo. No reactivar importaciones sin acreditar los derechos necesarios y las condiciones de la plataforma. Los favoritos antiguos de Airbnb se eliminan del navegador al abrir esta versión. La retirada del catálogo vigente no reescribe el historial Git ni las cachés que ya existan en dispositivos externos.

## Booking

`stays.json`: catálogo CC0 de Wikidata ya incluido en CERCA. `venue-stays.json` añade un registro cercano a una de las sedes, procedente de una consulta Wikidata con P10532/P3607 y coordenadas. Identificadores: P10532 (numérico) y P3607 (ruta). Fuente: https://www.wikidata.org/ . No se hace scraping de Booking ni se inventan fichas o valoraciones.

### Ampliación del 19 de octubre de 2026

`osm-stays.json` es una selección derivada de **189 alojamientos adicionales** publicados en OpenStreetMap, bajo **ODbL 1.0**, © OpenStreetMap contributors: https://www.openstreetmap.org/copyright . Conserva nombre, tipo de alojamiento, coordenadas, dirección pública y enlace al objeto OSM. Las geometrías de edificios se convierten al promedio de sus nodos, que puede diferir de la entrada; las distancias son en línea recta. Cada alojamiento está a menos de 10 km de al menos un pabellón confirmado. No es una lista exhaustiva ni una comprobación de apertura o acceso en las fechas del usuario. No se importan identidades de colaboradores OSM, teléfonos ni datos de huéspedes.

Fuente: API oficial de lectura `https://api.openstreetmap.org/api/0.6/map.json?bbox=...`, consultada en ventanas acotadas alrededor de los pabellones y sus zonas hoteleras. Reproducción: `python scripts/import-osm-hotels.py /ruta/mapas/*.json --retrieved-at AAAA-MM-DD`. El importador elimina duplicados por objeto y por identidad/nombre próximo; `osm-stays-exclusions.json` documenta 19 exclusiones revisadas, incluidos otros nombres de hoteles ya importados, nombres no identificables y alojamientos con acceso específico sin verificar. Las tres bases se conservan en ficheros separados con sus propias licencias.

`published-booking-links.json` documenta siete rutas de Booking que se encontraron publicadas en sitios web enlazados desde OSM, con URL de la página fuente y fecha de consulta. Cinco pertenecen a nuevos alojamientos; dos corresponden a establecimientos ya representados o excluidos y no crean tarjetas duplicadas. Solo se reutilizan los enlaces publicados, sin afiliación, fotos, precios, reseñas ni condiciones comerciales del sitio. La existencia del enlace no confirma que la ficha siga activa ni disponibilidad. No se han inferido slugs a partir del nombre.

Los otros **184** alojamientos adicionales no tienen ficha verificada en Booking. La tarjeta dice **«Alojamiento real · buscar en Booking»**, su botón **«Buscar en Booking»** y el detalle explica que es una búsqueda por nombre y coordenadas que puede devolver otros hoteles. La selección de plataforma «Booking» incluye los hoteles que se pueden consultar en esa plataforma mediante búsqueda; no afirma que sean inventario importado de Booking. Se mantienen desconocidos tarifas, reseñas, capacidad, cancelación y servicios. No se incorporó el CSV comercial de Bright Data ni datos antiguos de GeoNames investigados durante la búsqueda. El plugin de Booking no estaba disponible y no se presenta como conectado.

### Ampliación adicional: establecimientos y aviso de fechas

Se consultaron 16 nuevas ventanas acotadas de la API oficial OSM alrededor de hoteles conocidos próximos a las sedes, el 19 de octubre de 2026. Tras revisar duplicados y accesos específicos se añadieron **44 alojamientos** (233 OSM en total, con cinco rutas publicadas de Booking y 228 búsquedas identificadas) y **59 comercios de alimentación** (450 en total). Los límites continúan siendo 10 km para alojamientos y 3 km para comercios, siempre desde una sede confirmada. Los nuevos registros conservan su enlace al objeto OSM y fecha; no se importan tarifas, reseñas ni fotos sin licencia.

Los importadores admiten `--merge-from ruta/al/catalogo.json` para mantener los registros publicados y sus fechas reales. `osm-stays-exclusions.json` conserva 25 exclusiones revisadas: se evita duplicar hoteles renombrados o el mismo hotel representado por un nodo y un edificio, y no se añaden residencias o albergues con acceso específico sin verificar.

El aviso de eventos, torneos, puentes y fiestas informa de posibles variaciones de tarifa y disponibilidad al elegir otras fechas. No es un detector de eventos ni aplica un recargo automático. Los enlaces de Booking conservan las fechas/grupo de la búsqueda; las fichas con ID/ruta publicada abren ese alojamiento y las demás siguen identificadas como búsquedas. Los anuncios de Airbnb mantienen su propio enlace y la advertencia de confirmar allí sus condiciones.

## Supermercados y tiendas de alimentación

`venue-markets.json`: **450 comercios únicos de OpenStreetMap**, de los que **307** tienen la etiqueta `shop=supermarket` y **143** `shop=convenience`. Consulta: **19 de octubre de 2026**, a través de exportaciones oficiales acotadas `api.openstreetmap.org/api/0.6/map.json`. El fichero conserva las URLs y límites de las ventanas consultadas, cobertura por sede, tipo, coordenadas, dirección y horario cuando están publicados, fecha y enlace al objeto OSM de cada comercio. Se reutilizan las exportaciones reales obtenidas ese mismo día para la ampliación de alojamientos, sin nuevos barridos masivos de ciudades.

© OpenStreetMap contributors, **ODbL 1.0**, https://www.openstreetmap.org/copyright . Selección y transformación por CERCA: promedio de nodos de edificios para ubicarlos, filtro a 3 km de alguna sede confirmada y eliminación de duplicados por ID y por nombre/punto próximo. No se incluyen identidades de colaboradores ni datos privados. Reproducción: `python scripts/import-market-catalogue.py /ruta/mapas/*.json --retrieved-at AAAA-MM-DD`, indicando la fecha real de obtención de las exportaciones. `market-exclusions.json` documenta seis comercios especializados o con clasificación inconsistente, excluidos tanto del catálogo como de las actualizaciones. Cada una de las 19 sedes confirmadas tiene al menos un supermercado documentado; las cuatro pendientes siguen sin recomendaciones de cercanía.

La primera consulta utiliza el catálogo fechado, identificado como guardado. La lista empieza por supermercados; las tiendas se pueden incluir expresamente. «Actualizar supermercados» intenta Overpass (3 km) y, si falla, la API oficial OSM en una ventana local limitada. Una respuesta local no demuestra que hayan desaparecido los comercios guardados fuera de su ventana. Se conserva su fecha y cobertura, así como la lista anterior durante la actualización o ante fallos. La copia anterior de Granada mantiene su fecha y se limita a su área, como el resto del catálogo.

Los enlaces «Cómo llegar» abren las coordenadas reales del comercio en Google Maps. Las distancias mostradas son en línea recta, y los tiempos a pie aproximados. El catálogo no acredita que el comercio siga abierto, su inventario ni sus horarios actuales. La cobertura es parcial, no un inventario exhaustivo de todos los supermercados de una localidad.

## Gasolineras

`fuel-references.json` contiene 38 nombres y direcciones aportados al proyecto el 20 de octubre de 2026, agrupados en 14 destinos. No incluye coordenadas, precios ni una verificación de cercanía; CERCA no los ordena como los más próximos. Cada dirección abre una búsqueda en Google Maps solo cuando el usuario pulsa «Ver ubicación». La ventana enlaza también al comparador público de gasolineras de OCU; CERCA no incorpora sus datos, no está afiliada y no conoce los precios mostrados allí.

La búsqueda adicional de gasolineras se inicia expresamente desde su ventana. Consulta `amenity=fuel` en OpenStreetMap alrededor del pabellón o localidad seleccionados (hasta 5 km mediante Overpass; si falla, una ventana local de la API oficial OSM). No guarda precios de combustible. Muestra la distancia en línea recta, la fecha de consulta y el enlace a la fuente. El enlace de ruta en coche abre Google Maps con las coordenadas del origen y de la gasolinera; la aplicación no calcula duración ni carga el mapa antes de abrirlo. Para pabellones sin coordenadas confirmadas no se realiza la búsqueda en OpenStreetMap, aunque se pueden consultar las direcciones aportadas y el comparador externo.

## Estimaciones de planificación

No son tarifas, descuentos, ofertas ni garantía de disponibilidad. No se añaden precios aleatorios por nombre o identificador.

- `hotel-price-references.json` conserva 278 precios medios aportados al proyecto el 19 de octubre de 2026. La columna de origen distingue «Booking» y «Estimado» tal como se recibió; CERCA no verificó esos importes mediante una API ni los actualiza en tiempo real. Se emparejan por destino y nombre normalizado, con cinco alias explícitos para nombres comerciales completos. Se muestran como referencia orientativa por alojamiento y noche, antes de impuestos o extras no confirmados.
- CERCA, estimación propia para los alojamientos: base declarada de 75 €/habitación doble, multiplicada por un factor de ciudad (1–1,65), temporada de verano (1,2, de junio a agosto) y habitaciones dobles previstas (`ceil(personas/2)`). Es un modelo propio sin tarifa observada de ese hotel. No demuestra cuál tiene hoy la tarifa más baja.
- El filtro y el orden usan la estimación central por persona y noche. En empates se ordena por distancia al pabellón. El rango de −30 % a +40 % es ilustrativo y no tiene garantía estadística.
- Se muestra presupuesto de grupo para todas las noches, sin impuestos o cargos adicionales no publicados. Las condiciones, vigencia del anuncio y disponibilidad deben comprobarse en la plataforma.

## Revisión de transparencia y privacidad, 19 de octubre de 2026

No hay extracción automatizada de Booking/Airbnb ni API de inventario conectada. Los enlaces publicados no acreditan vigencia o disponibilidad. No se utilizan marcas gráficas de las plataformas ni se afirma afiliación. Los precios son referencias aportadas o estimaciones propias de CERCA; los rangos no garantizan precios reales.

La búsqueda y los recientes no persisten sin la opción explícita «Recordar». Los favoritos y la apariencia son acciones elegidas por el usuario. Fotos remotas y mapas requieren activación durante cada visita y se pueden desactivar; el catálogo inicial no los solicita. Se publican en `dist/data/` copias JSON de las bases OSM con fechas, atribución, transformaciones, exclusiones y licencias, enlazadas desde «Privacidad y licencias». Los créditos fotográficos enlazan por separado fuente y licencia. No existe una certificación jurídica de todos los tratamientos o de los derechos individuales de cada obra.
