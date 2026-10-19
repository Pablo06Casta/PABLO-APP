# Procedencia del catálogo de bádminton

Consulta y selección: 18 de octubre de 2026. CERCA no está afiliada a Booking ni a Airbnb.

## Instalaciones

`../venues.json` recoge las 23 instalaciones comunicadas por el usuario, en 15 destinos municipales. Las 19 ubicaciones confirmadas se contrastaron con instalaciones de OpenStreetMap; cada registro guarda su enlace al objeto OSM, dirección y fecha. Los cuatro registros sin ubicación inequívoca se mantienen como pendientes y no generan recomendaciones ni consultas de cercanía. No se reutilizan paradas de autobús, cafés o aparcabicicletas como si fueran el pabellón.

© OpenStreetMap contributors, licencia ODbL 1.0: https://www.openstreetmap.org/copyright . Las coordenadas de edificios se calcularon como centro de sus nodos cuando fue necesario; no representan necesariamente la entrada de deportistas. Estella se corresponde con la instalación rotulada «Polideportivo Lizarreria» en OSM.

Pendientes: Aronova Badminton Center (Vitoria), Centro de Tecnificación de Madrid/Barajas, Polideportivo Insular Blanca Dona y Poliesportiu des Raspallar (Ibiza). La lista no confirma que cada instalación aloje un torneo concreto: el organizador debe confirmar su sede.

## Airbnb: datos abiertos de Inside Airbnb

`airbnb.json`: selección de **198 anuncios reales**, con ID conservado como cadena para evitar redondeos de identificadores largos. Datos de [Inside Airbnb](https://insideairbnb.com/get-the-data/), bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). CERCA realizó selección, normalización de tipos y servicios, y cálculos de estimaciones. No se importaron nombres de anfitriones, fotos ni datos de contacto.

Fuentes de la selección:

- Euskadi: https://data.insideairbnb.com/spain/pv/euskadi/2026-09-25/data/listings.csv.gz
- Madrid: https://data.insideairbnb.com/spain/comunidad-de-madrid/madrid/2026-09-17/data/listings.csv.gz
- Málaga: https://data.insideairbnb.com/spain/andaluc%C3%ADa/malaga/2026-09-28/data/listings.csv.gz
- Sevilla: https://data.insideairbnb.com/spain/andaluc%C3%ADa/sevilla/2026-09-25/data/listings.csv.gz

Se conserva `last_scraped` de cada fila como fecha de observación; puede diferir de la fecha de la carpeta publicada. El diccionario confirma que `price` es precio diario en moneda local y que el símbolo `$` es un artefacto de exportación, no un indicador de dólares: https://docs.google.com/spreadsheets/d/1iWCNJcSutYqpULSQHlNyGInUvHg2BoUGoNRIGa6Szc4/edit . En estas regiones la moneda local es EUR.

La selección considera anuncios a menos de 10 km de una sede confirmada, con tarifa observada entre 0 y 350 € (excluido cero), estancia mínima publicada no superior a siete noches y alguna disponibilidad anual en la captura. Se retienen hasta 25 más cercanos y 25 con menor tarifa histórica por sede, eliminando duplicados por ID. La disponibilidad anual histórica no confirma disponibilidad en las fechas del usuario. En la app se aplica además capacidad, estancia mínima, presupuesto y distancia solicitados.

Los puntos de Airbnb son aproximados. No se consideran direcciones exactas ni permiten garantizar una distancia peatonal. La cobertura no incluye todas las localidades; una búsqueda externa de Airbnb no se muestra como un anuncio importado. Los enlaces `/rooms/<id>` proceden de identificadores reales del dataset, no se generan a partir de nombres.

## Booking

`stays.json`: catálogo CC0 de Wikidata ya incluido en CERCA. `venue-stays.json` añade un registro cercano a una de las sedes, procedente de una consulta Wikidata con P10532/P3607 y coordenadas. Identificadores: P10532 (numérico) y P3607 (ruta). Fuente: https://www.wikidata.org/ . No se hace scraping de Booking ni se inventan fichas o valoraciones.

### Ampliación del 19 de octubre de 2026

`osm-stays.json` es una selección derivada de **189 alojamientos adicionales** publicados en OpenStreetMap, bajo **ODbL 1.0**, © OpenStreetMap contributors: https://www.openstreetmap.org/copyright . Conserva nombre, tipo de alojamiento, coordenadas, dirección pública y enlace al objeto OSM. Las geometrías de edificios se convierten al promedio de sus nodos, que puede diferir de la entrada; las distancias son en línea recta. Cada alojamiento está a menos de 10 km de al menos un pabellón confirmado. No es una lista exhaustiva ni una comprobación de apertura o acceso en las fechas del usuario. No se importan identidades de colaboradores OSM, teléfonos ni datos de huéspedes.

Fuente: API oficial de lectura `https://api.openstreetmap.org/api/0.6/map.json?bbox=...`, consultada en ventanas acotadas alrededor de los pabellones y sus zonas hoteleras. Reproducción: `python scripts/import-osm-hotels.py /ruta/mapas/*.json --retrieved-at AAAA-MM-DD`. El importador elimina duplicados por objeto y por identidad/nombre próximo; `osm-stays-exclusions.json` documenta 19 exclusiones revisadas, incluidos otros nombres de hoteles ya importados, nombres no identificables y alojamientos con acceso específico sin verificar. Las tres bases se conservan en ficheros separados con sus propias licencias.

`published-booking-links.json` documenta siete rutas de Booking que se encontraron publicadas en sitios web enlazados desde OSM, con URL de la página fuente y fecha de consulta. Cinco pertenecen a nuevos alojamientos; dos corresponden a establecimientos ya representados o excluidos y no crean tarjetas duplicadas. Solo se reutilizan los enlaces publicados, sin afiliación, fotos, precios, reseñas ni condiciones comerciales del sitio. La existencia del enlace no confirma que la ficha siga activa ni disponibilidad. No se han inferido slugs a partir del nombre.

Los otros **184** alojamientos adicionales no tienen ficha verificada en Booking. La tarjeta dice **«Alojamiento real · buscar en Booking»**, su botón **«Buscar en Booking»** y el detalle explica que es una búsqueda por nombre y coordenadas que puede devolver otros hoteles. La selección de plataforma «Booking» incluye los hoteles que se pueden consultar en esa plataforma mediante búsqueda; no afirma que sean inventario importado de Booking. Se mantienen desconocidos tarifas, reseñas, capacidad, cancelación y servicios. No se incorporó el CSV comercial de Bright Data ni datos antiguos de GeoNames investigados durante la búsqueda. El plugin de Booking no estaba disponible y no se presenta como conectado.

## Supermercados y tiendas de alimentación

`venue-markets.json`: **391 comercios únicos de OpenStreetMap**, de los que **271** tienen la etiqueta `shop=supermarket` y **120** `shop=convenience`. Consulta: **19 de octubre de 2026**, a través de exportaciones oficiales acotadas `api.openstreetmap.org/api/0.6/map.json`. El fichero conserva las URLs y límites de las ventanas consultadas, cobertura por sede, tipo, coordenadas, dirección y horario cuando están publicados, fecha y enlace al objeto OSM de cada comercio. Se reutilizan las exportaciones reales obtenidas ese mismo día para la ampliación de alojamientos, sin nuevos barridos masivos de ciudades.

© OpenStreetMap contributors, **ODbL 1.0**, https://www.openstreetmap.org/copyright . Selección y transformación por CERCA: promedio de nodos de edificios para ubicarlos, filtro a 3 km de alguna sede confirmada y eliminación de duplicados por ID y por nombre/punto próximo. No se incluyen identidades de colaboradores ni datos privados. Reproducción: `python scripts/import-market-catalogue.py /ruta/mapas/*.json --retrieved-at AAAA-MM-DD`, indicando la fecha real de obtención de las exportaciones. `market-exclusions.json` documenta seis comercios especializados o con clasificación inconsistente, excluidos tanto del catálogo como de las actualizaciones. Cada una de las 19 sedes confirmadas tiene al menos un supermercado documentado; las cuatro pendientes siguen sin recomendaciones de cercanía.

La primera consulta utiliza el catálogo fechado, identificado como guardado. La lista empieza por supermercados; las tiendas se pueden incluir expresamente. «Actualizar supermercados» intenta Overpass (3 km) y, si falla, la API oficial OSM en una ventana local limitada. Una respuesta local no demuestra que hayan desaparecido los comercios guardados fuera de su ventana. Se conserva su fecha y cobertura, así como la lista anterior durante la actualización o ante fallos. La copia anterior de Granada mantiene su fecha y se limita a su área, como el resto del catálogo.

Los enlaces «Cómo llegar» abren las coordenadas reales del comercio en Google Maps. Las distancias mostradas son en línea recta, y los tiempos a pie aproximados. El catálogo no acredita que el comercio siga abierto, su inventario ni sus horarios actuales. La cobertura es parcial, no un inventario exhaustivo de todos los supermercados de una localidad.

## Estimaciones de planificación

No son tarifas, descuentos, ofertas ni garantía de disponibilidad. No se añaden precios aleatorios por nombre o identificador.

- Booking: base declarada de 75 €/habitación doble, multiplicada por un factor de ciudad (1–1,65), temporada de verano (1,2, de junio a agosto) y habitaciones dobles previstas (`ceil(personas/2)`). Es un modelo propio sin tarifa observada de ese hotel. No demuestra cuál tiene hoy la tarifa más baja.
- Airbnb: tarifa histórica publicada del anuncio, multiplicada por 1,2 si la estancia es en junio–agosto. Se comparte la unidad entre el grupo solo si la capacidad publicada lo permite. No se presupone que el mismo apartamento pueda reservarse varias veces.
- El filtro y el orden usan la estimación central por persona y noche. En empates se ordena por distancia al pabellón. El rango de −30 % a +40 % es ilustrativo y no tiene garantía estadística.
- Se muestra presupuesto de grupo para todas las noches, sin impuestos o cargos adicionales no publicados. Las condiciones, vigencia del anuncio y disponibilidad deben comprobarse en la plataforma.
