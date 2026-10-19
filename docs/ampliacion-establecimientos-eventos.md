# Más establecimientos y aviso de precios · 19 de octubre de 2026

Se añadieron **44 alojamientos reales de OpenStreetMap** y **59 comercios de alimentación**. El catálogo derivado de OSM pasa de 189 a 233 alojamientos, y el de alimentación de 391 a 450 comercios (307 supermercados y 143 tiendas). Se conservan las 2.323 fichas de Wikidata con ID/ruta de Booking y los 198 anuncios reales de Inside Airbnb. Los nuevos alojamientos ofrecen búsquedas por nombre y ubicación en Booking, claramente identificadas; no se presentan como inventario importado de su API.

Se consultaron 16 ventanas pequeñas de la API oficial OSM en zonas hoteleras próximas a las sedes. Se descartaron duplicados, residencias y albergues con acceso específico sin verificar. Los límites de proximidad se mantienen: 10 km de una sede confirmada para alojamientos y 3 km para comercios. Las sedes pendientes conservan su estado. Los importadores admiten `--merge-from` para conservar registros y fechas anteriores; se verificó la repetición de importaciones sin cambios de datos ni duplicados. Se conserva atribución ODbL y fuente de cada establecimiento.

El aviso aparece en el listado, las tarjetas, el detalle y la comparación. Explica que cambiar a fechas con eventos, torneos, puentes o fiestas puede modificar precio y disponibilidad, y remite a los enlaces de reserva para confirmar las fechas elegidas. El listado incluye **«Consultar precios en Booking»**, con fechas, grupo y ubicación. Cada tarjeta conserva su enlace real o búsqueda explícita; las fichas de Airbnb mantienen su enlace de Airbnb.

No se detectan automáticamente fiestas ni eventos y no se aplican recargos inventados. Los presupuestos continúan siendo estimaciones identificadas, con el mismo orden y filtros. El acceso a Booking Demand API sigue sin estar habilitado.

## Validación

- `npm run check`: lint, 45 pruebas en seis archivos, TypeScript, compilación y smoke HTTP/PWA completos sin fallos.
- Importaciones incrementales repetidas y comparación estructural de resultados, conservando IDs y fechas. Sin eliminación de los establecimientos anteriores.
- Chromium sobre la compilación comprobó el aviso en listado, tarjeta y detalle; cambió entrada/salida a **4–8 de diciembre de 2026** y verificó esos parámetros en el enlace general, la tarjeta y el detalle de Booking.
- Santander mostró 45 alojamientos dentro del presupuesto/radio inicial y 24 supermercados. Se comprobó la nueva tarjeta Hotel Sol Boutique y la conservación del orden por precio estimado.
- Resoluciones 320/375/390/768/1024/1440 sin desbordamiento de la página ni errores JavaScript. Respuestas HTTPS reales transmitidas mediante el proxy y CA del entorno, sin desactivar TLS.

Fuentes y límites en `src/data/real/NOTICE-badminton.md`. No se verificaron tarifas ni disponibilidad comercial actual.
