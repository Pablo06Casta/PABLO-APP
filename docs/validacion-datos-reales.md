# Validación del catálogo real · 18 de octubre de 2026

- `npm run check`: lint, 24 pruebas en tres archivos, TypeScript, compilación y smoke HTTP/PWA completados sin fallos.
- Catálogo CC0: 2.322 hoteles españoles, con coordenadas e identificador o ruta de Booking; no hay generador de alojamientos ficticios.
- Todas las tarjetas visibles incluyen un enlace de Booking con hotel, fechas y huéspedes. Para Eurostars Puerta Real se comprobó el ID `90089` y la selección de ese hotel, no una búsqueda genérica por ciudad.
- Chromium: consulta real alrededor del centro de Granada devolvió 13 supermercados y tiendas de alimentación, incluyendo Carrefour Express y Covirán. Se verificó el uso de la API oficial de OpenStreetMap tras fallar Overpass. No se utilizó la copia de respaldo en esta comprobación.
- Chromium: la ficha de Eurostars Puerta Real consultó alrededor de sus propias coordenadas y mostró El súper Oriental, Alimentación Hong y Mini Market MYLQ, con enlaces para llegar.
- Presentación comprobada a 320, 375, 390, 768, 1024 y 1440 píxeles sin desbordamiento horizontal de la página. La tira de categorías permite desplazamiento local.
- Fotografías locales: nueve archivos reales de Commons con sus fuentes, autores y licencias. El resto usa miniaturas atribuidas o un aviso de foto no disponible.

Las consultas HTTPS de la prueba de navegador atravesaron el proxy proporcionado por el entorno mediante Playwright APIRequestContext, con el certificado del entorno y la verificación TLS activos. El navegador recibió las respuestas reales de los servicios, conservando sus cabeceras. Las pruebas unitarias de errores, límites, cancelación y recuperación usan fixtures identificados y no demuestran por sí solas acceso a los proveedores.

No se ha verificado disponibilidad para reservar, ni tarifas en tiempo real. Los enlaces de Booking se construyen con identificadores publicados por Wikidata; la apertura automatizada de Booking puede presentar una comprobación contra bots. El catálogo abierto es incompleto y puede contener datos antiguos.
