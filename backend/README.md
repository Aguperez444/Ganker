# Ganker — Backend

API REST y WebSockets de Ganker, construidos con FastAPI y SQLAlchemy y organizados en dominio, aplicación e infraestructura mediante puertos y adaptadores.

[Vista general del repositorio](../README.md) · [Guía del frontend](../Frontend/README.md) · [Aplicación publicada](https://gankerweb.app/)

## Tecnologías y requisitos

| Área                       | Tecnología                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| Entorno                    | Python 3.14, versión utilizada en CI y Docker; pip y un entorno virtual |
| API y servidor             | FastAPI y Uvicorn                                                       |
| Validación y configuración | Pydantic y Pydantic Settings                                            |
| Persistencia               | SQLAlchemy, SQLite local y PostgreSQL 16 en Docker                      |
| Migraciones                | Alembic                                                                 |
| Autenticación              | JWT de acceso y refresh con PyJWT; contraseñas con Argon2               |
| Integraciones              | Riot Games, Discord y proveedores de autenticación federada             |
| Exportación de reportes    | CSV, Excel con openpyxl y PDF con ReportLab                             |
| Pruebas                    | Pytest, pytest-mock, pytest-cov, Freezegun y HTTPX                      |

Las versiones de las dependencias se declaran en [requirements.txt](requirements.txt). Para ejecutar el stack completo con Docker, consultá el [README principal](../README.md#desarrollo-conjunto).

## Desarrollo local

Salvo que se indique lo contrario, los comandos de esta guía se ejecutan desde `backend/`. Si estás en la raíz del repositorio:

```bash
cd backend
```

### Entorno virtual e instalación

Linux / macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Windows (CMD), para activar el entorno ya creado:

```cmd
.venv\Scripts\activate.bat
```

Con el entorno activo:

```bash
python -m pip install -r requirements.txt
```

### Configuración local

Copiá [secrets.env.example](app/infrastructure/config/secrets.env.example) a `app/infrastructure/config/secrets.env`.

Linux / macOS:

```bash
cp app/infrastructure/config/secrets.env.example app/infrastructure/config/secrets.env
```

PowerShell:

```powershell
Copy-Item app/infrastructure/config/secrets.env.example app/infrastructure/config/secrets.env
```

Antes de iniciar el backend o usar Alembic, editá la copia y ajustá al menos estos valores:

```env
ENVIRONMENT=development
JWT_SECRET_KEY=REEMPLAZAR_POR_UNA_CLAVE_GENERADA
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173
SEED_DEMO_DATA=true
SMTP_PORT=587
```

Generá el valor de `JWT_SECRET_KEY` con:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

`SMTP_PORT` debe tener un valor numérico aunque no uses correo: la plantilla lo deja vacío y Pydantic lo valida como entero. Para usar SQLite, dejá `DATABASE_URL` sin definir; una cadena vacía no selecciona la base por defecto.

[settings.py](app/infrastructure/config/settings.py) carga la configuración con esta prioridad, de mayor a menor:

1. Variables del proceso, incluidas las inyectadas por Docker.
2. `app/infrastructure/config/secrets.local.env`.
3. `app/infrastructure/config/secrets.env`.
4. Valores predeterminados de `Settings`.

Las claves personales, como las de Riot y OAuth, pueden ir en `secrets.local.env`. Ambos archivos de secretos se excluyen de Git; los cambios de configuración compartidos deben reflejarse en la plantilla.

| Variable o grupo                                           | Uso                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`                                             | Conexión de SQLAlchemy; por defecto usa `app/infrastructure/database/db.db`         |
| `CORS_ORIGINS`                                             | Orígenes del frontend permitidos, separados por comas                               |
| `FRONTEND_URL`                                             | URL del cliente utilizada al construir enlaces de recuperación de contraseña        |
| `SEED_DEMO_DATA`                                           | Activa la sincronización de catálogos, usuarios, perfiles y equipos de demostración |
| `INITIAL_OWNER_*`                                          | Alta del owner inicial si están completas las credenciales y todavía no existe      |
| `RIOT_API_KEY`                                             | Acceso a las funciones de Riot que requieren una clave                              |
| `DISCORD_*`, `GOOGLE_*`, `TWITCH_*`, `STEAM_*`             | Credenciales y redirecciones de las integraciones de autenticación                  |
| `SMTP_*` o `RESEND_API_KEY`, `EMAIL_API_URL`, `EMAIL_FROM` | Envío de correo para recuperar contraseñas                                          |
| `UPLOAD_DIR`, `MEDIA_URL`                                  | Directorio físico y ruta pública de archivos multimedia                             |

Los proveedores de autenticación requieren registrar sus URL de retorno en la consola correspondiente. Las claves de estas integraciones se configuran en el backend.

El login admite 5 intentos por minuto y la recuperación de contraseña 3 solicitudes cada 15 minutos, por IP y por correo. Se configuran de forma independiente con `LOGIN_RATE_LIMIT_*` y `FORGOT_PASSWORD_RATE_LIMIT_*` en las plantillas de entorno. Ambos límites usan memoria del proceso: ejecutar un solo worker; para múltiples procesos o réplicas hace falta un almacén compartido.

Los límites usan `request.client.host`. Uvicorn debe resolver los encabezados reenviados únicamente desde proxies autorizados mediante `FORWARDED_ALLOW_IPS` ([configuración oficial](https://uvicorn.dev/settings/#http)); no usar `*`. El Compose de producción fija la IP de Nginx con `GANKER_NGINX_IP` y la autoriza en el backend. Nginx valida Cloudflare con `set_real_ip_from` y reemplaza `X-Forwarded-For` por la IP verificada. Si ejecutás otro proxy en desarrollo, configurá explícitamente su IP en el entorno de Uvicorn; sin esa configuración, las solicitudes comparten la IP del proxy.

Los baneos requieren una jerarquía superior a la del destinatario: un admin puede banear jugadores y un owner puede banear jugadores o admins. La duración debe ser positiva y no tiene máximo de negocio; se pueden enviar 365.000 días para un baneo de aproximadamente 1000 años. Si la duración supera la capacidad de las fechas de Python, se guarda el final del año 9999. El motivo requiere entre 1 y 500 caracteres, con al menos uno distinto de espacio.

`GET /api/v1/health` comprueba que FastAPI puede consultar la base de datos. Devuelve HTTP 200 con `{"status":"ok"}` o HTTP 503 con un estado genérico si falla la conexión o la consulta. No requiere autenticación y responde con `Cache-Control: no-store`. El smoke test de producción consulta esta ruta y exige HTTP 200, contenido JSON y el estado esperado antes de dar el despliegue por válido.

Al restablecer la contraseña se revocan todos los refresh tokens y enlaces de recuperación del usuario en la misma transacción. Los access tokens ya emitidos siguen válidos hasta su vencimiento.

### Base de datos y migraciones

Antes del primer arranque y después de incorporar nuevas migraciones:

```bash
python -m alembic upgrade head
```

El arranque de FastAPI ejecuta el seed sobre el esquema existente; **no crea las tablas automáticamente**. Con `SEED_DEMO_DATA=true`, sincroniza los datos de [database/seeds/](app/infrastructure/database/seeds/). Con `false`, omite los datos de demostración y solo intenta crear el owner inicial configurado. El bootstrap no reemplaza la contraseña de un owner existente.

Para usar PostgreSQL desde el backend local, podés levantar solo la base del Compose de desarrollo. Este comando se ejecuta desde la raíz del repositorio:

```bash
docker compose up -d db
```

Configurá luego esta URL en los secretos del backend y aplicá las migraciones desde `backend/`:

```env
DATABASE_URL=postgresql+psycopg2://dev_user:dev_password@localhost:5433/app_db
```

Dentro del Compose completo, el backend recibe una URL con `db:5432` y el entrypoint aplica las migraciones antes de iniciar Uvicorn.

Para generar una migración después de modificar los modelos ORM:

```bash
python -m alembic revision --autogenerate -m "descripcion_del_cambio"
```

Revisá la migración generada en `migrations/versions/` antes de aplicarla. Alembic usa la misma `DATABASE_URL` que la aplicación.

### Arranque

Con el entorno virtual activo y las migraciones aplicadas:

```bash
python -m uvicorn app.infrastructure.start.main:app --host 127.0.0.1 --port 8000 --reload
```

También existen los lanzadores `bash start_app.sh`, `.\start_app.ps1` y `start_app.bat`, que usan el entorno `backend/.venv`. Estos lanzadores no ejecutan migraciones.

| Recurso local | URL                                |
| ------------- | ---------------------------------- |
| Swagger UI    | http://127.0.0.1:8000/docs         |
| ReDoc         | http://127.0.0.1:8000/redoc        |
| OpenAPI       | http://127.0.0.1:8000/openapi.json |

En local, FastAPI sirve `/media` desde `backend/media/`. En Docker, Nginx sirve los medios desde el volumen compartido.

La autenticación conserva `/auth/v1` por diseño. Moderación usa `/api/v1/moderation`, bajo el mismo prefijo que el resto de la API:

| Operación | Método y ruta |
| --------- | ------------- |
| Login, refresh y logout | `POST /auth/v1/login`, `/auth/v1/refresh`, `/auth/v1/logout` |
| Recuperar y restablecer contraseña | `POST /auth/v1/forgot-password`, `/auth/v1/reset-password` |
| Autenticación federada | `/auth/v1/oauth/...` |
| Reportar un jugador | `POST /api/v1/moderation/` |
| Listar reportes | `GET /api/v1/moderation/reported_players` |
| Listar baneos | `GET /api/v1/moderation/banned-players` |
| Listar jugadores con baneo vigente | `GET /api/v1/moderation/banned-players/active` |
| Banear y desbanear | `POST /api/v1/moderation/ban`, `/api/v1/moderation/{player_id}/unban` |

Los listados reciben los filtros, fechas ISO 8601 y paginación (`skip`, `limit`) como parámetros de query, sin cuerpo JSON. Por ejemplo: `/api/v1/moderation/banned-players?banned_user=usuario&skip=0&limit=10`. Conservan el permiso de admin u owner. Las rutas antiguas de moderación (`/moderation/...`) ya no se registran; las URL de retorno del frontend `/auth/callback/{provider}` se mantienen.

### Borrado de rangos

`DELETE /api/v1/ranks/{rank_id}` reasigna todos los perfiles de rol vinculados,
incluidos los eliminados lógicamente, y los requisitos mínimo y máximo de los
equipos activos e inactivos. Usa el rango inmediatamente inferior del mismo
videojuego o, si no existe, el inmediatamente superior. Solo cambia los límites
que apuntan al rango eliminado; conserva el estado de los perfiles y equipos.
La reasignación y el borrado se realizan en una única transacción. Si el rango
tiene perfiles o equipos asociados y no existe otro rango disponible, devuelve
HTTP 400 y conserva los datos.

### Contratos de moderación para el frontend

`GET /api/v1/moderation/banned-players/active?username=usuario&skip=0&limit=10`
requiere admin u owner y devuelve solo usuarios no eliminados cuyo último baneo sigue
vigente y cuyo flag `banned` está activo. Excluye baneos vencidos y desbaneos manuales.
`username` es opcional y busca coincidencias parciales sin distinguir mayúsculas;
`skip` debe ser mayor o igual a 0 y `limit` debe estar entre 1 y 100 (por defecto, 10).
El orden es por `user_id` ascendente y cada usuario aparece una sola vez:

```json
{
  "players": [
    {
      "user_id": 42,
      "username": "usuario",
      "reason": "Insultos reiterados",
      "expires_at": "2026-11-01T12:00:00+00:00"
    }
  ]
}
```

`expires_at: null` indica un baneo sin vencimiento. Una página vacía devuelve
`{"players": []}`. El endpoint `/banned-players` sigue devolviendo el historial.

El login con credenciales válidas de un usuario baneado conserva HTTP 400 y el campo
`error`, e incluye `reason` y `expires_at` del último baneo. El mensaje también
contiene el motivo y el vencimiento para los clientes que solo muestran `error`:

```json
{
  "error": "El baneo del jugador aún no ha finalizado. Motivo: Insultos reiterados. Vencimiento: 2026-11-01T12:00:00+00:00",
  "reason": "Insultos reiterados",
  "expires_at": "2026-11-01T12:00:00+00:00"
}
```

Las fechas se envían en ISO 8601. Si un usuario tiene el flag de baneo activo pero
no tiene registro de baneo, `reason` y `expires_at` son `null`; el login sigue
bloqueado. Las credenciales incorrectas no revelan estos datos.

`POST /api/v1/moderation/` permite un reporte del mismo denunciante al mismo jugador
cada 24 horas por defecto, incluso si el anterior ya fue resuelto o el nuevo tiene
otro motivo. La espera se configura en segundos con `PLAYER_REPORT_COOLDOWN_SECONDS`
(mínimo 1). Otros denunciantes pueden reportar al mismo jugador y el denunciante
puede reportar a otros usuarios durante ese plazo. El control consulta los reportes
persistidos y serializa las solicitudes de cada denunciante con un bloqueo de fila
en PostgreSQL durante la transacción. Un intento anticipado no crea un reporte ni
extiende el plazo; devuelve HTTP 429, el encabezado `Retry-After` en segundos y:

```json
{
  "error": "Ya reportaste a este jugador recientemente. Podrás volver a reportarlo a partir de 2026-11-01T12:00:00+00:00.",
  "retry_after": 3600,
  "retry_at": "2026-11-01T12:00:00+00:00"
}
```

## Estructura y organización

```text
backend/
├── app/
│   ├── application/
│   │   ├── ports/                  # Interfaces de repositorios y servicios externos
│   │   ├── services/               # Servicios de aplicación, como exportar reportes
│   │   └── use_cases/              # Casos de uso
│   ├── domain/
│   │   ├── exceptions/             # Excepciones agrupadas por área del negocio
│   │   ├── models/                 # Entidades y objetos del dominio
│   │   ├── services/               # Validaciones y servicios del dominio
│   │   └── specifications/         # Criterios componibles de búsqueda y filtrado
│   └── infrastructure/
│       ├── api/
│       │   ├── auth/               # JWT, estados OAuth y hashing de contraseñas
│       │   ├── chat/               # Conexiones de chat y notificaciones
│       │   ├── controllers/        # Endpoints HTTP y WebSocket
│       │   ├── dependencies/       # Inyección de dependencias y permisos
│       │   ├── dto/
│       │   │   ├── request/        # Esquemas de entrada
│       │   │   └── response/       # Esquemas de salida
│       │   └── teams/              # Conexiones para actualizaciones de equipos
│       ├── catalog_providers/      # Catálogos externos de personajes
│       ├── config/                 # Settings y plantillas de configuración
│       ├── database/
│       │   ├── mappers/            # Conversión entre dominio y ORM
│       │   ├── models/             # Modelos SQLAlchemy
│       │   ├── repositories/       # Implementaciones de repositorios
│       │   ├── seeds/              # Datos iniciales en CSV
│       │   └── unit_of_work/       # Unidad de trabajo y su factory
│       ├── discord_api/            # Vinculación de cuentas Discord
│       ├── federated_auth/         # Proveedores de autenticación federada
│       ├── riot_api/               # Cuentas, rangos y estadísticas de Riot
│       ├── start/main.py           # Configuración y arranque de FastAPI
│       └── storage/                # Almacenamiento de archivos en disco
├── media/                          # Recursos multimedia locales
├── migrations/versions/            # Migraciones Alembic
├── tests/
│   ├── conftest.py                 # Fixtures de base, sesión, usuarios y cliente HTTP
│   ├── integration/                # Pruebas de API y base de datos
│   └── unit/                       # Pruebas de aplicación, dominio e infraestructura
├── Dockerfile / Dockerfile.prod
├── entrypoint.sh / entrypoint.prod.sh
├── alembic.ini / pytest.ini
├── requirements.txt
├── start_app.sh / .ps1 / .bat
└── README.md
```

Los casos de uso coordinan operaciones del dominio y trabajan con los puertos de `application/ports/`. Los adaptadores de `infrastructure/` conectan esos puertos con SQLAlchemy, el almacenamiento y los servicios externos. Los DTOs de la API se ubican en `infrastructure/api/dto/`; los filtros componibles están en `domain/specifications/`.

## Convenciones de nombrado

| Elemento                         | Convención                                     | Ejemplo existente                                |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Módulos, funciones y variables   | `snake_case`                                   | `create_team.py`, `team_id`                      |
| Clases                           | `PascalCase`                                   | `Videogame`, `Team`                              |
| Puertos / interfaces             | Archivo `i_<nombre>.py`, clase con prefijo `I` | `i_user_repository.py`, `IUserRepository`        |
| Implementaciones de repositorios | `<entidad>_repository_impl.py`                 | `character_repository_impl.py`                   |
| Modelos ORM                      | `<entidad>_orm.py`                             | `user_orm.py`                                    |
| Mappers                          | `<entidad>_mapper.py`                          | `game_usage_report_mapper.py`                    |
| Controladores HTTP               | `<recurso>_controller.py`                      | `character_controller.py`                        |
| DTOs de entrada y salida         | Sufijos `_request.py` y `_response.py`         | `create_team_request.py`, `get_user_response.py` |
| Excepciones                      | Sufijo `_exception.py`, agrupadas por área     | `entity_not_persisted_exception.py`              |
| Pruebas                          | Prefijo `test_`, dentro de `backend/tests/`    | `test_create_team.py`                            |

El sufijo `_impl` se usa en implementaciones de repositorios y algunos adaptadores. Otros servicios se nombran por su tecnología o función, como `jwt_token_service.py` y `local_disk_storage_service.py`.

## Desarrollo y verificación

Con el entorno virtual activo, desde `backend/`, ejecutá antes de abrir un PR:

```bash
pytest
```

[pytest.ini](pytest.ini) configura la búsqueda en `tests/`, añade el proyecto al path de Python y genera un reporte de cobertura de `app/` en la terminal.

| Comando                                                      | Uso                                |
| ------------------------------------------------------------ | ---------------------------------- |
| `pytest tests/unit`                                          | Solo pruebas unitarias             |
| `pytest tests/integration`                                   | Solo pruebas de integración        |
| `pytest --no-cov`                                            | Suite completa sin medir cobertura |
| `pytest tests/unit/application/test_create_team.py --no-cov` | Ejecutar un archivo concreto       |

Las fixtures compartidas de [tests/conftest.py](tests/conftest.py) crean SQLite en memoria y un directorio temporal de medios. El cliente HTTP de pruebas reemplaza el arranque normal para no ejecutar el seed de la aplicación.

Las pruebas adicionales en PostgreSQL comprueban los reportes simultáneos,
la selección del último baneo vigente y el borrado de rangos con perfiles y
equipos vinculados. Se habilitan con
`GANKER_TEST_POSTGRES_URL`; crean y eliminan un esquema temporal por prueba:

```bash
GANKER_TEST_POSTGRES_URL='postgresql+psycopg2://usuario@localhost/ganker_test' \
  .venv/bin/pytest tests/integration/database/test_moderation_postgres.py \
    tests/integration/database/test_rank_deletion_postgres.py --no-cov
```

Sin esa variable, esas pruebas se omiten y las demás usan SQLite. Las pruebas de
borrado de rangos con equipos en SQLite activan explícitamente las claves foráneas.

En CI se usa Python 3.14 y se ejecuta `pytest`. El flujo de ramas y revisión está en el [README principal](../README.md#flujo-de-trabajo).

## Backend en producción

El [stack de producción](../docker-compose.prod.yml) inyecta las variables desde `.env.prod`, usa PostgreSQL y desactiva los datos de demostración. La preparación del entorno y el despliegue se describen en el [README principal](../README.md#despliegue).

[Dockerfile.prod](Dockerfile.prod) inicia Uvicorn con un solo worker: las conexiones WebSocket y el limitador de login mantienen estado en memoria. Su entrypoint aplica las migraciones antes de arrancar. Con `ENVIRONMENT=production`, FastAPI desactiva Swagger, ReDoc y el esquema OpenAPI público.
