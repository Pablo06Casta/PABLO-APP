# Corrección de supermercados · 19 de octubre de 2026

## Problema reproducido en la web pública anterior

La alternativa a Overpass consultaba una ventana de ±0,0025° y devolvía su resultado vacío como definitivo. En A Estrada mostró cero comercios, aunque Familia, Mercadona y Froiz están a unos 0,9–1 km del pabellón. Granollers devolvió únicamente una tienda de golosinas, etiquetada erróneamente como supermercado en OSM. La actualización dependía de la disponibilidad del proveedor y el detalle requería una segunda acción para cargar comercios.

## Resultado

- 391 comercios reales y fechados de OSM: 271 supermercados y 120 tiendas de alimentación. Hay cobertura dentro de 3 km de las 19 sedes con ubicación confirmada. Se reutilizaron 26 exportaciones oficiales acotadas obtenidas el mismo día para los hoteles; no se generaron comercios ni se descargaron ciudades enteras.
- La consulta inicial carga el catálogo sin peticiones externas. Se muestran supermercados por defecto; las tiendas se incluyen expresamente. Fecha, cobertura parcial, fuente OSM y ruta a cada comercio quedan visibles.
- El detalle carga la compra desde el pabellón de su propia búsqueda y muestra inicialmente los tres más cercanos, con opción de ver toda la lista.
- La actualización mantiene visibles los resultados y combina la respuesta local con datos guardados fuera de su ventana. Un fallo no borra la lista. Los datos guardados conservan su fecha y no se presentan como una respuesta en tiempo real.
- Se excluyeron seis registros con identidad o clasificación inconsistente; las exclusiones también se aplican a la actualización para evitar que reaparezcan. Las cuatro sedes sin coordenadas no generan recomendaciones de cercanía.

## Comprobaciones

`npm run check`: lint, **45 pruebas en seis archivos**, TypeScript, compilación y smoke HTTP/PWA completados sin fallos. Los tests cubren cobertura de todas las sedes confirmadas, coordenadas/radio, identificación de supermercados y tiendas, exclusiones, fallo de actualización, conservación de comercios fuera de la ventana local, cancelación, origen del detalle, fechas y enlaces.

Chromium sobre la compilación, con respuestas HTTPS reales transmitidas mediante el proxy y CA del entorno, sin desactivar TLS:

- Aldabe mostró **45 supermercados**, y **65** al incluir tiendas, sin consultar al proveedor para la primera carga.
- Solares cargó automáticamente los tres más cercanos en el detalle; «Ver los 4 establecimientos» permitió consultar el conjunto.
- En A Estrada, «Actualizar supermercados» intentó el proveedor y recibió una respuesta 200 de la API oficial OSM. Se mantuvieron Familia, Mercadona y Froiz, con la atribución y fecha de los datos guardados. Los fallos/tiempos de espera de Overpass no bloquearon la consulta.
- Tras eliminar la ruta de interceptación y activar el modo **sin conexión real** del contexto, se comprobaron las 19 sedes: todas devolvieron supermercados, ordenados por distancia. Las coordenadas de cada enlace «Cómo llegar» están a menos de 3 km del pabellón. Ningún proveedor ni fixture de red suplió estas pruebas offline.
- Se comprobó el estado pendiente de Aronova sin comercios inventados, y 320/375/390/768/1024/1440 px sin desbordamiento del diálogo ni errores JavaScript.

## Supermercados del catálogo por sede (hasta 3 km; cobertura parcial)

| Sede | Supermercados | Total con tiendas |
| --- | ---: | ---: |
| Granollers · Pavelló Municipal del Congost | 8 | 21 |
| Solares · Polideportivo Municipal Mies del Corro | 4 | 4 |
| Santander · Palacio de Deportes de Santander | 5 | 6 |
| Santander · Complejo Municipal Ruth Beitia | 9 | 13 |
| Vitoria-Gasteiz · Centro Cívico Aldabe | 45 | 65 |
| Vitoria-Gasteiz · Centro Cívico Salburua | 45 | 65 |
| A Estrada · Pavillón Manuel Coto Ferreiro | 3 | 3 |
| Alicante · Centro de Tecnificación de la Comunidad Valenciana | 30 | 49 |
| Alicante · Pabellón Pitiu Rochel | 30 | 49 |
| Benalmádena · Polideportivo Municipal Arroyo de la Miel | 28 | 45 |
| Cartagena · Pabellón Municipal Wssell de Guimbarda | 29 | 34 |
| Cartagena · Palacio de Deportes de Cartagena | 29 | 35 |
| Estella-Lizarra · Polideportivo Municipal Tierra Estella | 8 | 11 |
| Huelva · Palacio de Deportes de Huelva | 23 | 35 |
| Huelva · Pabellón Andrés Estrada | 23 | 36 |
| La Rinconada · Pabellón Municipal Fernando Martín | 6 | 9 |
| Paracuellos de Jarama · Polideportivo Municipal de Paracuellos | 6 | 7 |
| Oviedo · Centro Deportivo Corredoria Arena | 37 | 46 |
| Oviedo · Complejo Deportivo El Cristo | 48 | 65 |

Los recuentos entre sedes pueden compartir comercios. No se acredita apertura, inventario ni horario actual. Las distancias son en línea recta y los tiempos a pie aproximados, no rutas calculadas. Datos © OpenStreetMap contributors, ODbL 1.0. Fuentes y transformación en `src/data/real/NOTICE-badminton.md`; capturas en `supermercados-escritorio.png` y `supermercados-movil.png`.
