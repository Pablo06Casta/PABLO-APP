# CERCA · viajes de bádminton

**Web:** https://pablo06casta.github.io/PABLO-APP/

Encuentra alojamientos reales y supermercados alrededor del **pabellón de competición**. Selecciona sede, fechas y grupo; compara presupuestos orientativos por persona y noche y abre Booking o una búsqueda externa de Airbnb para comprobar condiciones y reservar en la plataforma.

## Qué funciona

- Selector con las 23 instalaciones comunicadas por el usuario, en 15 destinos. Hay 19 puntos comprobados y cuatro pendientes, identificados sin simular cercanía.
- Calendario de competiciones publicado por la Federación Española de Bádminton: 58 torneos con ciudad y fecha confirmadas en la copia del 19 de octubre de 2026, filtros por ciudad y mes, ficha oficial de cada torneo y actualización semanal al compilar la web. Se excluyen cursos, concentraciones y ciudades «Por Determinar». La ciudad no identifica el pabellón: para buscar alojamiento se debe elegir uno de los pabellones confirmados de CERCA.
- Alojamientos con identidad/ID de Booking de Wikidata (2.322 fichas originales y una adicional), 233 alojamientos adicionales de OpenStreetMap cerca de los pabellones; Airbnb se ofrece únicamente como búsqueda externa. Los cinco enlaces de Booking publicados en las webs de los nuevos hoteles abren su ficha; los otros 228 se identifican como búsquedas por nombre y ubicación, sin afirmar que estén disponibles en Booking. Cobertura limitada, no inventario completo.
- Orden inicial por **menor precio estimado por persona y noche**, con desempate por distancia al pabellón. Presupuesto inicial editable de 50 €/persona/noche.
- Filtros de presupuesto, plataforma, categoría, distancia al pabellón, capacidad/estancia mínima conocidas y servicios publicados. Nunca se confirma capacidad desconocida: los hoteles sin datos presuponen habitaciones dobles y lo indican.
- Detalle con rango orientativo, presupuesto del grupo, explicación de estimación, fuente, fechas y enlace del anuncio. La búsqueda externa de Airbnb conserva destino, fechas y grupo; Booking recibe hotel y habitaciones dobles previstas.
- Supermercados ordenados desde el pabellón, incluidos en el mapa junto a alojamientos y sede. Catálogo fechado de 307 supermercados y 143 tiendas de alimentación para las 19 sedes confirmadas: carga inmediata, selección de tipo y actualización explícita sin perder los resultados guardados. Los detalles cargan la compra al abrirse, desde su propia sede. Distancias en línea recta y minutos a pie aproximados, no rutas calculadas. «Cómo llegar» abre Google Maps.
- Favoritos, comparación de tres opciones, navegación móvil, modo oscuro y PWA. El autocompletado de municipios se conserva para destinos adicionales; donde no hay sede elegida se identifica el modo centro de ciudad.
- Viajes compartidos mediante enlace con sede, fechas, viajeros y hasta tres identificadores del catálogo. Al abrirlo se comprueban todos los campos; si una ficha desaparece, se conserva el resto. Los gastos de la calculadora no se comparten. Quien tenga el enlace puede ver la selección.
- Sección de presupuesto del grupo al principio de la aplicación: destino, número de viajeros y nombres opcionales (por defecto, Viajero 1, Viajero 2…). Permite añadir hasta 50 gastos con categoría, concepto y precio total, por persona o por persona y día; incluye restaurante, comida, alojamiento, gasolina, transporte y otros. Una sola opción de la comparación puede aportar una estimación de alojamiento para las noches elegidas. El total se reparte a partes iguales, asignando los céntimos sobrantes por orden para cuadrar la suma. Descarga un PDF con gastos, subtotales y aportación individual. El presupuesto permanece en memoria y no se incorpora al enlace compartido.
- En el detalle de cada alojamiento, enlaces de Google Maps para trayectos andando, en coche y en transporte público hasta un pabellón confirmado. CERCA solo muestra la distancia en línea recta y no calcula tiempos de ruta. Abrir Google Maps envía las dos coordenadas; el mapa de OpenStreetMap del detalle se carga a petición.

## Datos y precios

**No son ofertas confirmadas.** CERCA usa un modelo propio de planificación común por ciudad y categoría, sin observar tarifas de cada hotel; no permite afirmar cuál tiene hoy el precio real más bajo. No se publican tarifas históricas ni anuncios importados de Airbnb. Los rangos no tienen garantía estadística. Los importes pueden cambiar y excluyen extras/impuestos no publicados. Eventos, torneos, puentes y fiestas pueden modificar el precio y la disponibilidad al cambiar fechas. El aviso aparece en listado, tarjetas, detalle y comparación; «Consultar precios en Booking» conserva fechas, grupo y zona. No se detectan eventos ni se inventan recargos: el modelo de planificación permanece identificado como estimación.

Se filtra y ordena con la misma estimación central por persona y noche. Los hoteles no reciben variaciones aleatorias por nombre/ID. Para grupos impares se prevén habitaciones dobles completas.

El usuario reserva en la plataforma: CERCA no cobra ni confirma reservas. Las fichas pueden estar antiguas o retiradas. «Ver en Booking» abre una ruta publicada o selecciona un identificador conocido; «Buscar en Booking» consulta el nombre y la ubicación de un alojamiento real de OSM, pero puede devolver otros resultados. No confirma su presencia en Booking. El catálogo tiene huecos; las búsquedas externas de ambas plataformas amplían la zona con fechas y huéspedes. No se hace scraping de Booking o Airbnb ni se simula una conexión con el plugin de Booking, que no está disponible en esta sesión.

Fuentes, licencias, fechas, método y límites: [NOTICE-badminton.md](src/data/real/NOTICE-badminton.md). Wikidata: CC0. Sedes/tiendas y alojamientos OSM: © OpenStreetMap contributors, ODbL. Los datos importados de Inside Airbnb se retiraron por no tener acreditados todos los derechos necesarios.

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
npm run check       # Lint, pruebas, tipos, build y smoke HTTP/PWA.
npm run test:watch
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Las pruebas de proveedores usan fixtures para comprobar fallos y recuperación y no demuestran por sí solas acceso real. Se valida por separado en navegador el selector de pabellón, enlaces a las dos plataformas, presupuesto y orden, filtros y supermercados reales.

## Servicios y publicación

La consulta inicial utiliza `venue-markets.json`, con comercios reales de OSM y fecha de consulta, hasta 3 km del pabellón. Incluye 450 comercios únicos y cobertura para las 19 sedes con coordenadas. La copia previa de Granada se conserva para búsquedas en esa zona. El botón «Actualizar supermercados» consulta Overpass y, si falla, la API oficial de lectura OSM en una ventana limitada (±0,006°, reducida a ±0,003° si falla). Una respuesta local no elimina comercios guardados fuera de esa ventana; se conserva su fecha. Si falla la actualización, la lista guardada sigue disponible. Las sedes sin coordenadas se mantienen pendientes sin simular proximidad. Hay caché en memoria de una hora; los vacíos no se cachean. Se distinguen supermercados y tiendas de alimentación y se enlaza cada nuevo registro a OSM. La cobertura es parcial y no acredita apertura, inventario o tarifas actuales.

La geolocalización es opcional y requiere acción y permiso del navegador. Nominatim solo se consulta explícitamente; el autocompletado de 8.132 municipios es local y las coordenadas municipales no precisadas se identifican como aproximadas. Las sedes seleccionadas usan sus propios puntos comprobados.

La PWA conserva interfaz, catálogo y fotos locales sin conexión tras la primera carga, sin precargar teselas. Los servicios públicos tienen límites: para tráfico significativo se necesita backend con caché y un proveedor con capacidad contratada. Una integración comercial de inventario en tiempo real requiere una API autorizada y gestión segura de credenciales fuera del cliente.

La instalación utiliza `registry.npmjs.org`. Servicios de ejecución: `nominatim.openstreetmap.org`, `overpass-api.de`, `api.openstreetmap.org`, `tile.openstreetmap.org`, `thumb.wikimedia.org` y `upload.wikimedia.org`. Los enlaces abren Booking, Airbnb, Commons y Google Maps. La preparación de datos usa APIs públicas de `query.wikidata.org`, `commons.wikimedia.org`.

El workflow `.github/workflows/ci.yml` comprueba, compila para `/PABLO-APP/` y publica en GitHub Pages mediante Actions. Para probar esa ruta:

```sh
CERCA_BASE_PATH=/PABLO-APP/ npm run build -- --outDir /tmp/cerca-pages-dist
CERCA_BASE_PATH=/PABLO-APP/ npm run preview -- --outDir /tmp/cerca-pages-dist --host 127.0.0.1 --port 5181 --strictPort
```

Se conserva `scripts/refresh-catalogue.py` para el catálogo base de Wikidata y sus fotografías libres. `scripts/import-osm-hotels.py` importa exportaciones oficiales `map.json` sin datos personales de colaboradores, aplica el radio de 10 km, elimina duplicados y respeta exclusiones revisadas. No consulta Booking ni inventa rutas. La actualización de sedes y alojamientos abiertos debe conservar fuentes, fechas, licencia y criterios de `NOTICE-badminton.md` y ejecutar las comprobaciones.

## Transparencia y privacidad

Proyecto personal de Pablo, sin ingresos ni afiliación con Booking.com o Airbnb. La información pública no acredita disponibilidad, vigencia de enlaces ni la legalidad turística de cada alojamiento. Los avisos no sustituyen permisos de reutilización. No reactivar importaciones de las plataformas sin autorización y derechos acreditados.

«Privacidad y licencias» ofrece controles para recordar búsquedas (desactivado por defecto), mostrar fotos remotas y cargar mapas (opciones en memoria, apagadas al iniciar cada visita), borrar los datos locales y descargar bases OSM bajo ODbL. Favoritos y apariencia se guardan cuando el usuario los elige; búsquedas y recientes no persisten sin activación expresa. Se retiran favoritos Airbnb de versiones anteriores. El borrado no afecta a registros de proveedores ni al almacenamiento técnico de la PWA; se explica cómo quitarlo desde el navegador.

El contacto público es la incidencia de GitHub del repositorio, asociada a la cuenta del responsable. No publicar datos personales en incidencias públicas. No se ha aportado correo privado ni identidad legal completa del operador: la política no debe presentarse como certificación jurídica exhaustiva. Las conexiones de proveedores y sus transferencias requieren revisión según su configuración y contratos reales.

Durante la compilación se generan `dist/data/*.json` con copias de los datos OSM empleados, exclusiones y aviso municipal. El archivo `public/data/README.md` explica transformación, fuentes y licencias. Las fotografías muestran autor, enlace a fuente y enlace a licencia; los archivos decorativos antiguos sin uso se retiran del paquete. No hay teselas en la caché sin conexión.

## Calendario de torneos

Fuente: [calendario oficial FESBA](https://www.badminton.es/calendar/192/Calendario-FESBA). `src/data/real/fesba-calendar.json` es una selección fechada de competiciones en España con ciudad publicada; cada fila enlaza a la ficha original. No importa fotos, documentos, inscripciones o datos de deportistas. `scripts/refresh-fesba-calendar.py` consulta las páginas públicas del año en curso y el siguiente, comprueba país, grupo, fecha y ciudad, y revisa las fechas finales solo para destinos de CERCA. Si la fuente no responde conserva la última copia. El workflow actualiza esta copia al publicar los lunes; la web indica la fecha de consulta y avisa si la copia tiene más de dos semanas.

Una ciudad coincidente no confirma que el evento se dispute en una instalación concreta. CERCA pide elegir explícitamente un pabellón con coordenadas verificadas y propone llegar la víspera y salir al día siguiente; el usuario puede editar las fechas. Los eventos sin pabellón confirmado solo enlazan a la fuente. El calendario oficial puede cambiar, por lo que siempre debe consultarse antes de reservar.
