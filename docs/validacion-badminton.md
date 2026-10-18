# Validación de CERCA para viajes de bádminton

18 de octubre de 2026. Versión preparada a partir del catálogo del usuario.

- 23 sedes en el selector: 19 ubicaciones comprobadas en instalaciones OSM y cuatro pendientes, sin recomendaciones de proximidad para esas cuatro.
- 34 pruebas en cuatro archivos completadas: presupuestos, filtros, capacidad/estancia mínima conocidas, habitaciones de grupos impares, enlaces de fichas reales con IDs largos, proximidad al pabellón, cambios de sede, favoritos y comparación. Lint, TypeScript, compilación y smoke HTTP/PWA completados sin fallos. Tras corregir el área de clic del checkbox se repitieron compilación, lint y smoke; el navegador comprobó la interacción real.
- Chromium sobre la compilación: Aldabe (Vitoria-Gasteiz), grupo de dos personas y tres noches mostró 20 opciones de Booking y Airbnb con estimaciones centrales por persona/noche ordenadas: 15, 20, 20, 29, 30, 32, 34, 36, 36, 40, 42, 42, 42, 42, 45, 45, 45, 48, 50, 50 €. Son cálculos orientativos, no ofertas verificadas en las plataformas.
- Verificados filtro de Airbnb, cocina publicada, apertura de su detalle, enlace real `/rooms/<id>`, fechas/grupo y restablecimiento de filtros. Comprobados cambio a Santander/Palacio de Deportes y el estado sin resultados de proximidad para Aronova, pendiente de coordenadas.
- Consulta real desde Aldabe devolvió cinco comercios: Fruteria y Alimentacion, Distrilatina, Autoservicio Urcelay Carnicería, una tienda sin nombre publicado y PrimaPrix. Respuesta 200 de la API oficial de OSM tras fallar la consulta a Overpass; cobertura local limitada identificada. No se utilizaron fixtures ni la copia de Granada para esta validación.
- Verificadas resoluciones 320, 375, 390, 768, 1024 y 1440 píxeles sin desbordamiento de página, y sin errores JavaScript durante el recorrido.

El navegador recibió respuestas HTTPS reales mediante Playwright APIRequestContext, utilizando el proxy y la CA proporcionados por el entorno, con verificación TLS activa y cabeceras conservadas. Las pruebas unitarias con fixtures no acreditan conectividad externa por sí mismas.

No se han comprobado tarifas actuales, disponibilidad de las fechas, cancelación ni vigencia de cada anuncio. El modelo de Booking no observa tarifas de cada hotel. Airbnb usa datos históricos con sus fechas. La cobertura es parcial; A Estrada no tiene fichas importadas y las búsquedas externas se distinguen de las fichas del catálogo. No se hizo scraping de Booking o Airbnb.
