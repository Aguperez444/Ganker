# Ganker — Frontend

Cliente web de Ganker, construido con React y Vite para buscar jugadores, gestionar perfiles y equipos, conversar y acceder a las funciones de administración.

[Vista general del repositorio](../README.md) · [Guía del backend](../backend/README.md) · [Aplicación publicada](https://gankerweb.app/)

## Tecnologías y requisitos

| Área               | Tecnología                                        |
| ------------------ | ------------------------------------------------- |
| Interfaz           | React y React DOM                                 |
| Desarrollo y build | Vite con el plugin de React                       |
| Navegación         | React Router                                      |
| Comunicación       | Axios y WebSockets                                |
| Formularios        | React Hook Form                                   |
| Estado compartido  | Context API para sesión, chat y videojuego activo |
| Estilos            | Tailwind CSS integrado con Vite                   |
| Pruebas            | Vitest, jsdom y React Testing Library             |
| Calidad de código  | ESLint y Prettier                                 |

Las versiones y los scripts se declaran en [package.json](package.json). CI y la imagen de producción usan Node.js 22; el rango declarado en `engines.node` es `^20.19.0 || >=22.12.0`. Necesitás Node compatible y npm.

## Desarrollo local

Los comandos de esta guía se ejecutan desde `Frontend/`, salvo que se indique lo contrario. Si estás en la raíz del repositorio:

```bash
cd Frontend
npm install
```

[package-lock.json](package-lock.json) está versionado para registrar las versiones resueltas. Al cambiar dependencias, incluí sus cambios junto con los de `package.json`.

### Configuración local

Copiá [.env.example](.env.example) a `.env`.

Linux / macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

La plantilla define la URL base del backend:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Usá la URL del backend que tengas levantado. Reiniciá Vite si modificás `.env`. Si accedés al frontend mediante un origen distinto de `http://localhost:5173`, agregalo también a `CORS_ORIGINS` en la [configuración del backend](../backend/README.md#configuración-local).

- Vite expone al navegador las variables con prefijo `VITE_`; las claves de Riot, OAuth y correo se configuran en el backend.
- `.env` queda fuera de Git. Si incorporás una variable compartida, agregala a `.env.example`.
- Las URL de WebSocket se derivan de `VITE_API_URL`, cambiando `http/https` por `ws/wss`. Con la variable vacía, usan el origen de la página. Esta lógica está en [src/utils/websocket.js](src/utils/websocket.js).
- El servidor de Vite redirige `/media` hacia el backend configurado, con `http://localhost:8000` como destino por defecto.

### Arranque

Con el backend disponible en la URL configurada:

```bash
npm run dev
```

Vite escucha en **http://localhost:5173** con recarga automática. La pantalla inicial es la landing de Ganker. Para detener el servidor, usá `Ctrl+C`.

El [arranque conjunto con Docker](../README.md#desarrollo-conjunto) configura la URL de API y el acceso a través de Nginx desde Compose.

## Estructura y organización

```text
Frontend/
├── Public/                         # publicDir configurado en Vite; respetar la P mayúscula
│   ├── images/                     # Logos e imágenes
│   └── sounds/                     # Sonidos de notificaciones
├── src/
│   ├── api/                        # Cliente Axios, módulos HTTP y WebSockets
│   ├── components/
│   │   ├── common/ / layout/ / landing/
│   │   ├── jugadores/ / equipos/ / game_profiles/
│   │   ├── games/ / characters/ / ranks/ / region/ / roles/
│   │   └── chat/ / discord/ / riot/ / reportes/
│   ├── context/                    # Sesión, chat y videojuego activo
│   ├── hooks/                      # Estado y lógica reutilizable de la aplicación
│   ├── pages/                      # Pantallas de la aplicación
│   │   └── admin/                  # Catálogos, moderación y reportes
│   ├── routes/                     # Rutas públicas, privadas y de administración
│   ├── utils/                      # Validaciones, formatos, medios y utilidades
│   ├── App.jsx                     # Componente raíz
│   ├── main.jsx                    # Montaje de React
│   ├── index.css                   # Estilos globales y tema de Tailwind
│   └── setupTests.js                # Preparación del entorno de pruebas
├── .env.example
├── Dockerfile                      # Servidor de desarrollo en contenedor
├── package.json / package-lock.json
├── vite.config.js                  # Vite, Tailwind, proxy de medios y Vitest
├── eslint.config.js
└── README.md
```

`api/` concentra la comunicación con el backend. Los hooks de `hooks/` y los contextos de `context/` coordinan los datos y el estado; las páginas de `pages/` componen las pantallas con los componentes de `components/`. Para nuevas funciones, mantené las llamadas a la API en hooks o contextos y pasá los datos y acciones a los componentes por props.

[src/routes/AppRouter.jsx](src/routes/AppRouter.jsx) reúne las rutas; `ProtectedRoute` y `PublicOnlyRoute` controlan el acceso según la sesión y el rol. El backend aplica los permisos de los endpoints.

La carpeta de estáticos se llama **`Public/`** y se sirve desde la raíz: por ejemplo, `Public/images/logo_svg.svg` se accede como `/images/logo_svg.svg`. Tailwind se integra con el plugin de Vite y el tema se define en `src/index.css`.

## Convenciones de nombrado

| Elemento                          | Convención                                              | Ejemplo existente                           |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Componentes React                 | `PascalCase.jsx`, frecuentemente con sufijo `Component` | `JugadorCardComponent.jsx`, `TopNavbar.jsx` |
| Páginas                           | `PascalCase` con sufijo `Page.jsx`                      | `CrearEquipoPage.jsx`                       |
| Contextos                         | `PascalCase` con sufijo `Context.jsx`                   | `AuthContext.jsx`                           |
| Hooks                             | `camelCase` con prefijo `use` y extensión `.js`         | `useCrearEquipo.js`                         |
| Módulos de API                    | `camelCase`, habitualmente con sufijo `Api.js`          | `teamApi.js`, `chatSocketApi.js`            |
| Utilidades, funciones y variables | `camelCase`                                             | `recorteAvatar.js`, `formatearFechaReporte` |
| Constantes compartidas            | `UPPER_SNAKE_CASE`                                      | `CLAVES_SESION`                             |
| Pruebas                           | Junto al archivo, con sufijo `.test.js` o `.test.jsx`   | `useMiEquipo.test.js`, `App.test.jsx`       |

Mantené la coherencia con el módulo que estés modificando: no todos los componentes existentes llevan el sufijo `Component`. Los archivos con JSX usan `.jsx`; los hooks y utilidades sin JSX usan `.js`.

El proyecto combina nombres en español e inglés y conserva carpetas como `game_profiles/`. Respetá también las mayúsculas de `Frontend/` y `Public/` para que las rutas funcionen en Linux y Docker.

## Desarrollo y verificación

Desde `Frontend/`, ejecutá antes de abrir un PR:

```bash
npm run lint
npm test
npm run build
```

Para verificar el formato:

```bash
npm run format:check
```

| Comando                | Uso                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con recarga automática                                               |
| `npm run lint`         | Verificar el código con ESLint                                                              |
| `npm run lint:fix`     | Aplicar las correcciones automáticas de ESLint                                              |
| `npm run format`       | Aplicar Prettier al código y archivos de configuración/documentación incluidos en el script |
| `npm run format:check` | Verificar el formato sin modificar archivos                                                 |
| `npm test`             | Ejecutar la suite de Vitest una vez                                                         |
| `npm run test:watch`   | Ejecutar pruebas en modo interactivo                                                        |
| `npm run build`        | Generar el frontend compilado en `dist/`                                                    |
| `npm run preview`      | Servir localmente el build existente para revisarlo                                         |

Vitest usa jsdom y [src/setupTests.js](src/setupTests.js). Las pruebas viven junto al archivo que verifican, como `CrearEquipoPage.test.jsx`, `useCrearEquipo.test.js` y `validaciones.test.js`. Los componentes se prueban con React Testing Library; los hooks pueden verificarse con `renderHook` y las llamadas de red se simulan en las pruebas.

La [configuración actual de CI](../.github/workflows/ci.yml) instala dependencias, ejecuta `npm test` y genera el build. El lint y el formato se verifican con los comandos anteriores. El flujo de ramas y revisión está en el [README principal](../README.md#flujo-de-trabajo).

## Build y producción

Para generar y revisar el build localmente:

```bash
npm run build
npm run preview
```

Vite incorpora las variables `VITE_*` durante el build. Cambiar la URL de API del frontend publicado requiere recompilarlo.

En producción, [nginx/Dockerfile.prod](../nginx/Dockerfile.prod) compila `dist/` y lo copia a la imagen de Nginx. El frontend usa `VITE_API_URL` vacía para comunicarse con la API y los WebSockets del mismo origen mediante HTTPS y WSS. La aplicación ya está desplegada en **[gankerweb.app](https://gankerweb.app/)**.

Los metadatos y la política de indexación se definen en [src/seo/metadata.js](src/seo/metadata.js). Solo la portada es indexable; el sitemap contiene esa URL. Al agregar una pantalla a `AppRouter`, agregá también su ruta a `PAGE_METADATA`: [seo.config.js](seo.config.js) genera el HTML con metadatos para cada ruta y el archivo de rutas que Nginx incluye en producción. `RouteMetadata` mantiene esos mismos datos durante la navegación dentro de la app. Las URL desconocidas muestran la página 404 y Nginx conserva el código HTTP 404.

La configuración compartida y el despliegue a OCI se describen en el [README principal](../README.md#despliegue).
