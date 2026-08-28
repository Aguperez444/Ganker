# Ganker — Frontend

Cliente web del proyecto **Ganker**, construido con React + Vite.
Este documento es la guía de arranque: seguí los pasos en orden y en menos de 5
minutos deberías tener el proyecto corriendo.

---

## 1. Stack tecnológico

| Capa                    | Tecnología                          |
| ----------------------- | ----------------------------------- |
| Librería UI             | React 19                            |
| Build tool / dev server | Vite 8                              |
| Cliente HTTP            | Axios                               |
| Estado global           | Context API (sesión, chat)          |
| Lógica reutilizable     | Custom hooks (`src/hooks/`)         |
| Ruteo                   | React Router 7 (`react-router-dom`) |
| Estilos                 | Tailwind CSS 4                      |
| Testing                 | Vitest 4 + React Testing Library    |
| Linter / Formatter      | ESLint 10 (flat config) + Prettier  |
| Gestor de paquetes      | npm                                 |

---

## 2. Requisitos previos

| Herramienta | Versión                                                                |
| ----------- | ---------------------------------------------------------------------- |
| Node.js     | **24.x LTS** (mínimo 20.19), declarada en `engines` del `package.json` |
| npm         | Viene con Node.js (11.x)                                               |
| Git         | Cualquier versión reciente                                             |

Verificá que tengas todo:

```bash
node -v
```

```bash
npm -v
```

> **Finales de línea:** el proyecto incluye un `.gitattributes` que los normaliza
> a LF. Es necesario porque Git for Windows deja `core.autocrlf=true` (checkout en
> CRLF) mientras que Prettier siempre escribe LF: sin esa normalización, cada
> `npm run format` marcaría archivos enteros como modificados. No toques
> `core.autocrlf` a mano.

---

## 3. Puesta en marcha (paso a paso)

### 3.1 Clonar el repositorio

```bash
git clone https://github.com/Aguperez444/Ganker.git
```

```bash
cd Ganker/Frontend
```

> Todos los comandos de este README se ejecutan **parados dentro de `Frontend/`**,
> no en la raíz del repo.

### 3.2 Instalar las dependencias

```bash
npm install
```

Esto lee `package.json` + `package-lock.json` e instala **exactamente** las mismas
versiones que usa el resto del equipo. `node_modules/` nunca se sube al repo;
el `package-lock.json` **sí** va versionado, y no se regenera a mano.

### 3.3 Crear tu archivo `.env`

El proyecto lee la URL del backend desde una variable de entorno. Copiá la
plantilla versionada y ajustala si hace falta:

```bash
Copy-Item .env.example .env
```

Contenido por defecto:

```
VITE_API_URL=http://127.0.0.1:8000
```

Es la URL base contra la que Axios arma todos los pedidos. **Reglas importantes:**

- Vite solo expone al navegador las variables que empiezan con `VITE_`.
- `.env` **no se sube** al repo (está en `.gitignore`); `.env.example` **sí**.
- Si agregás una variable nueva, sumala también a `.env.example` para el resto
  del equipo.

### 3.4 Levantar el servidor de desarrollo

```bash
npm run dev
```

Vite queda escuchando en **http://localhost:5173** con hot-reload (los cambios
que guardás se reflejan en el navegador al instante). Para cortarlo: `Ctrl + C`.

Si todo salió bien vas a ver la pantalla inicial con el texto
_"Entorno de frontend levantado correctamente"_ y el valor de `VITE_API_URL`
que configuraste.

### 3.5 Verificación rápida

```bash
npm run lint
```

```bash
npm test
```

Ambos deberían terminar en verde. Si es así, tu entorno quedó listo.

---

## 4. Scripts disponibles

| Comando                | Qué hace                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con hot-reload en `localhost:5173`        |
| `npm run build`        | Genera el build de producción optimizado en `dist/`              |
| `npm run preview`      | Sirve localmente el contenido de `dist/` para revisar el build   |
| `npm run lint`         | Corre ESLint sobre todo el proyecto                              |
| `npm run lint:fix`     | Igual que el anterior, pero arregla lo que puede automáticamente |
| `npm run format`       | Aplica el formato de Prettier                                    |
| `npm run format:check` | Verifica el formato sin modificar archivos (útil en CI)          |
| `npm test`             | Corre toda la suite de tests una vez                             |
| `npm run test:watch`   | Tests en modo watch, mientras desarrollás                        |

---

## 5. Estructura de carpetas

```
Frontend/
├── Public/                 # Archivos estáticos (se sirven tal cual desde la raíz "/")
│   └── images/             # Imágenes del proyecto
├── src/                    # Código fuente
│   ├── api/                # Axios y conexión con el backend
│   ├── hooks/              # Lógica de aplicación (estado + orquestación de datos)
│   ├── context/            # Estado global (sesión, chat)
│   ├── components/         # Componentes genéricos reutilizables
│   │   ├── common/         # botones, inputs, modales, spinners, etc.
│   │   ├── jugadores/      # JugadorCard, JugadorForm, JugadorList
│   │   ├── equipos/        # equivalentes para equipos
│   │   └── chat/           # ChatWindow, MessageBubble, MessageInput
│   ├── pages/              # Vistas completas (arman hooks + components)
│   ├── routes/             # Definición y protección de rutas
│   ├── utils/              # Funciones puras (validaciones, formateo, constantes)
│   ├── App.jsx
│   ├── main.jsx            # Punto de entrada: monta <App /> en el DOM
│   ├── index.css           # Directivas de Tailwind
│   └── setupTests.js       # Setup global de los tests
├── .env.example            # Plantilla de variables de entorno (SÍ se versiona)
├── eslint.config.js        # Configuración de ESLint (flat config)
└── vite.config.js          # Configuración de Vite + Tailwind + Vitest
```

> No hay `tailwind.config.js` ni `postcss.config.js`: Tailwind 4 se configura
> desde el CSS (`src/index.css`) y se engancha a Vite con el plugin
> `@tailwindcss/vite`. Si necesitás extender el tema (colores, fuentes), se hace
> con la directiva `@theme` dentro de `src/index.css`.


### Regla de convivencia entre carpetas

Un componente de `components/` **no llama directamente a `api/`**. Esa llamada
vive en un hook de `hooks/` (o en `context/` si el dato es global), y el
componente solo recibe datos y funciones **por props**.

```
api/  →  hooks/  →  pages/  →  components/
         (o context/ si el estado es global)
```

---

## 6. Dependencias y por qué está cada una

### Producción

| Paquete               | Para qué                       |
| --------------------- | ------------------------------ |
| `react` / `react-dom` | Librería UI                    |
| `react-router-dom`    | Ruteo entre pantallas          |
| `axios`               | Cliente HTTP contra el backend |

### Desarrollo

| Paquete                              | Para qué                                                                |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `vite`, `@vitejs/plugin-react`       | Build tool y dev server con soporte JSX/HMR                             |
| `tailwindcss`, `@tailwindcss/vite`   | Estilos utility-first, integrados a Vite                                |
| `vitest`, `jsdom`                    | Test runner + DOM simulado para los tests                               |
| `@testing-library/react`             | Renderizar y consultar componentes en los tests                         |
| `@testing-library/jest-dom`          | Matchers extra (`toBeInTheDocument`, etc.)                              |
| `@testing-library/user-event`        | Simular clicks, tipeo y demás interacciones                             |
| `eslint`, `@eslint/js`, `globals`    | Linter (los dos últimos son requeridos por la flat config de ESLint 10) |
| `eslint-plugin-react-hooks`          | Verifica las reglas de los hooks                                        |
| `eslint-plugin-react-refresh`        | Avisa si un archivo rompe el hot-reload                                 |
| `prettier`, `eslint-config-prettier` | Formateo automático, sin pelearse con ESLint                            |

> **Regla del equipo:** ninguna dependencia nueva se agrega sin avisar en el
> grupo y dejarlo asentado en el documento de metodología.

---

## 7. Testing

- **Vitest** es el test runner: usa la misma config que Vite (`vite.config.js`)
  y tiene una API casi idéntica a la de Jest.
- **React Testing Library** testea el componente _como lo usaría una persona_:
  qué se ve en pantalla y qué pasa al hacer click, no los detalles internos.

**Ubicación de los tests:** cada archivo lleva su test al lado, con el mismo
nombre y sufijo `.test.jsx`.

```
src/components/jugadores/
├── JugadorCard.jsx
└── JugadorCard.test.jsx
```

**Qué testear:** componentes de `components/`, hooks de `hooks/` (con
`renderHook`) y funciones puras de `utils/`. Las llamadas reales de `api/` se
mockean con `vi.mock`.

---

## 8. Build de producción

```bash
npm run build
```

Genera `dist/` con los archivos estáticos optimizados. Para previsualizarlo:

```bash
npm run preview
```

> Dónde se aloja `dist/` en producción todavía **no está definido** (candidatos:
> Vercel o Netlify con deploy automático en cada push a `main`).

---

## 9. Convenciones de código

- **Componentes:** PascalCase con extensión `.jsx` → `JugadorCardComponent.jsx`.
- **Hooks, funciones y variables:** camelCase → `useJugadores.js`, `formatearFecha`.
- **Un componente por archivo**, en la subcarpeta de `components/` que le
  corresponda por dominio.
- Antes de abrir un PR, corré `npm run lint` y `npm run format`. No se mergea
  con el lint o los tests en rojo.

---

## 10. Flujo de trabajo con Git

1. `git pull origin main` antes de empezar algo nuevo.
2. Crear tu rama: `git switch -c feature/nombre-corto`.
3. Commits sobre esa rama hasta terminar la feature.
4. Abrir el Pull Request contra `main` describiendo qué resuelve y cómo probarlo.
   Los PR de **frontend** los revisa **@franleal**.
5. Con el PR aprobado y mergeado, borrar la rama.
