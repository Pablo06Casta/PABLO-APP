# PABLO APP

Base web con React, TypeScript y Vite. Incluye una página de bienvenida en español, diseño adaptable a móvil y una demo interactiva para sumar y reiniciar un contador. El contador vive en memoria y vuelve a cero al recargar. Es un punto de partida para desarrollar la aplicación.

## Requisitos

- Node.js 24.19.0 (fijado en `.nvmrc`) y npm 11.
- No necesita base de datos, credenciales ni servicios externos para ejecutarse.

## Instalar y ejecutar

Desde la carpeta del repositorio (`/workspace/PABLO-APP` en el entorno en la nube):

```sh
# Si usas nvm: nvm install && nvm use
npm ci --cache /tmp/pablo-app-npm-cache
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

El servidor de desarrollo utiliza el puerto 5173. Los procesos deben volver a iniciarse al abrir una máquina nueva; las dependencias pueden conservarse en la imagen del entorno. Cada tarea en la nube está aislada: utiliza esta copia del repositorio sin crear worktrees adicionales.

## Validar

```sh
npm run check
```

Ejecuta el análisis estático, las pruebas de interfaz con Vitest y Testing Library, la comprobación de tipos y la compilación. Después inicia temporalmente el servidor de la versión compilada en un puerto libre asignado por el sistema, comprueba por HTTP la página y sus recursos y cierra ese servidor.

También puedes ejecutar cada comprobación por separado:

```sh
npm run lint
npm run test
npm run typecheck
npm run build
npm run smoke  # Requiere una compilación reciente.
```

`npm run test:watch` mantiene las pruebas activas durante el desarrollo. `npm run preview -- --host 0.0.0.0 --port 4173 --strictPort` permite inspeccionar `dist/` después de compilar; es un servidor de comprobación local, no un despliegue público.

## Estructura

- `src/App.tsx`: página inicial y demo interactiva.
- `src/App.css` y `src/index.css`: estilos adaptables.
- `src/App.test.tsx`: renderizado, interacción y reinicio.
- `scripts/smoke.mjs`: verificación HTTP de la compilación.
- `package-lock.json`: versiones exactas; usa `npm ci` para respetarlas.

Las descargas de dependencias utilizan `registry.npmjs.org`. En la nube conserva las comprobaciones de TLS e integridad y no guardes credenciales en el repositorio.
