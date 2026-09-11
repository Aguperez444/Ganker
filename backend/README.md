# Ganker — Backend

API REST del proyecto **Ganker**, construida con FastAPI + SQLAlchemy bajo arquitectura limpia (puertos y adaptadores / hexagonal).
Este documento es la guía de arranque: seguí los pasos en orden y en menos de 5
minutos deberías tener el backend corriendo.

---

## 1. Stack tecnológico

| Capa / Rol                      | Tecnología                                   |
| ------------------------------- | -------------------------------------------- |
| Framework web                   | FastAPI >= 0.141.1                           |
| Servidor ASGI                   | Uvicorn >= 0.52.4                            |
| ORM                             | SQLAlchemy >= 2.0                            |
| Base de datos (Local)           | SQLite (vía `sqlite:///.../db.db`)           |
| Base de datos (Docker / Prod)   | PostgreSQL 16 (`psycopg2-binary`)            |
| Migraciones                     | Alembic >= 1.19.2                            |
| Validación y esquemas           | Pydantic v2 >= 2.13.5 + Pydantic Settings    |
| Autenticación                   | PyJWT (tokens JWT access + refresh)          |
| Hashing de contraseñas          | Argon2 (`argon2-cffi`)                       |
| Testing                         | Pytest 9 + pytest-mock + pytest-cov          |
| Cliente HTTP de prueba          | HTTPX (usado por TestClient de FastAPI)      |
| Manejo de archivos              | Python `shutil` + almacenamiento en disco    |

---

## 2. Requisitos previos

| Herramienta | Versión                                                 |
| ----------- |---------------------------------------------------------|
| Python      | **3.14+** (probado y compatible con 3.14)               |
| pip         | Incluido con la instalación de Python                   |
| Git         | Cualquier versión reciente                              |
| Docker      | Opcional (para levantar el stack completo con Postgres) |

Verificá que tengas Python y pip instalados:

```bash
python3 --version
```

```bash
pip --version
```

---

## 3. Puesta en marcha (paso a paso)

### 3.1 Clonar el repositorio y pararse en `backend/`

```bash
git clone https://github.com/Aguperez444/Ganker.git
```

```bash
cd Ganker/backend
```

> Todos los comandos de este README se ejecutan **parados dentro de `backend/`**,
> no en la raíz del repo (salvo que se indique lo contrario).

### 3.2 Crear el entorno virtual

Creá un entorno virtual `.venv` para aislar las dependencias:

- **Linux / macOS:**
  ```bash
  python3 -m venv .venv
  ```
- **Windows:**
  ```powershell
  python -m venv .venv
  ```

### 3.3 Activar el entorno virtual

- **Linux / macOS:**
  ```bash
  source .venv/bin/activate
  ```
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD):**
  ```cmd
  .\.venv\Scripts\activate.bat
  ```

### 3.4 Instalar las dependencias

```bash
pip install -r requirements.txt
```

Esto instala las librerías necesarias con las versiones declaradas en `requirements.txt`.

### 3.5 Configurar el archivo de secretos (`secrets.env`)

El backend lee la clave secreta para firmar los tokens JWT y la URL opcional de base de datos desde `app/infrastructure/config/secrets.env`.

Asegurate de que exista el archivo `app/infrastructure/config/secrets.env` con el siguiente contenido mínimo:

```env
# Clave para la firma de tokens JWT
JWT_SECRET_KEY=GankerSecretKeyCambiarEnProduccion

# Base de datos (opcional en local):
# Si se deja comentado o vacío, el backend usa automáticamente SQLite local en app/infrastructure/database/db.db
# Para usar PostgreSQL local fuera de Docker:
# DATABASE_URL=postgresql+psycopg2://dev_user:dev_password@localhost:5433/app_db
```

> **Importante:** La base de datos SQLite local se crea automáticamente al iniciar y se puebla con los datos iniciales (videojuegos, roles, rangos, personajes y usuario admin) mediante `seed_data.py`. No requiere ninguna configuración previa.

### 3.6 Levantar el servidor de desarrollo

Podés levantarlo usando el script correspondiente a tu sistema operativo o directamente con Python:

- **Linux / macOS (script):**
  ```bash
  ./start_app.sh
  ```
- **Windows (PowerShell):**
  ```powershell
  .\start_app.ps1
  ```
- **Windows (CMD):**
  ```cmd
  start_app.bat
  ```
- **O directamente con uvicorn / python:**
  ```bash
  python app/infrastructure/start/main.py
  ```

El backend quedará escuchando en **http://127.0.0.1:8000** con hot-reload activado. Para cortarlo: `Ctrl + C`.

### 3.7 Verificación rápida

1. **Documentación interactiva (Swagger UI):**
   Abrí tu navegador en **http://127.0.0.1:8000/docs** para explorar y probar todos los endpoints de la API.
2. **Documentación alternativa (ReDoc):**
   Disponible en **http://127.0.0.1:8000/redoc**.
3. **Ejecutar la suite de tests:**
   ```bash
   pytest
   ```
   Toda la suite debe terminar en verde.

---

## 4. Scripts disponibles

| Comando / Script | Qué hace |
| ---------------- | -------- |
| `./start_app.sh` | Levanta el backend en Linux/macOS configurando `PYTHONPATH` y hot-reload |
| `.\start_app.ps1` | Levanta el backend en Windows vía PowerShell |
| `start_app.bat` | Levanta el backend en Windows vía Símbolo del Sistema (CMD) |
| `pytest` | Ejecuta todos los tests unitarios e integrados con reporte de cobertura |
| `pytest tests/unit` | Corre exclusivamente los tests unitarios |
| `pytest tests/integration` | Corre exclusivamente los tests de integración |
| `pytest --no-cov` | Corre los tests rápidamente omitiendo el análisis de cobertura |
| `alembic upgrade head` | Aplica las últimas migraciones de base de datos |

---

## 5. Estructura de carpetas

El backend implementa una **Arquitectura Limpia / Hexagonal (Puertos y Adaptadores)**:

```
backend/
├── app/
│   ├── application/                   # Casos de uso y puertos (interfaces)
│   │   ├── ports/                     # Interfaces abstractas (IUserRepository, IStorageService, etc.)
│   │   └── use_cases/                 # Casos de uso (RegisterPlayer, RegisterUser, UserLogin, etc.)
│   │
│   ├── domain/                        # Núcleo del negocio puro (sin dependencias externas)
│   │   ├── exceptions/                # Excepciones de dominio organizadas por área
│   │   ├── models/                    # Modelos de entidad pura (User, Videogame, Character, etc.)
│   │   └── services/                  # Servicios de dominio independientes (SlugService, etc.)
│   │
│   └── infrastructure/                # Adaptadores y tecnologías externas
│       ├── api/                       # Capa de entrada HTTP / REST
│       │   ├── auth/                  # Implementación de hashing (Argon2) y JWT
│       │   ├── controllers/           # Routers de FastAPI para cada recurso
│       │   ├── dependencies/          # Inyección de dependencias y validación de roles
│       │   └── dto/                   # Data Transfer Objects (request y response Pydantic)
│       ├── config/                    # Settings de la aplicación y lectura de secrets.env
│       ├── database/                  # Persistencia relacional
│       │   ├── mappers/               # Mapeo bidireccional entre ORM y modelos de dominio
│       │   ├── models/                # Modelos de tablas SQLAlchemy ORM
│       │   ├── repositories/          # Implementaciones de repositorios contra la base de datos
│       │   ├── unit_of_work/          # Implementación del patrón Unit of Work con SQLAlchemy
│       │   ├── engine_factory.py      # Creación y configuración del Engine de base de datos
│       │   └── seed_data.py           # Datos semilla iniciales (LoL, roles, rangos, admin)
│       ├── start/                     # Entrada de la aplicación FastAPI (main.py)
│       └── storage/                   # Servicio de guardado de archivos multimedia en disco local
│
├── media/                             # Directorio donde se guardan las imágenes subidas en local
├── migrations/                        # Versiones y configuración de migraciones Alembic
├── tests/                             # Suite de pruebas automatizadas
│   ├── conftest.py                    # Fixtures globales (base de datos en memoria, clientes, tokens)
│   ├── integration/                   # Tests de integración (API endpoints y repositorios)
│   └── unit/                          # Tests unitarios (application, domain, infrastructure)
│
├── Dockerfile                         # Imagen Docker del backend
├── pytest.ini                         # Configuración de pytest y cobertura
├── requirements.txt                   # Dependencias de Python del proyecto
├── start_app.sh                       # Script de arranque para Linux/macOS
├── start_app.bat                      # Script de arranque para Windows CMD
└── start_app.ps1                      # Script de arranque para Windows PowerShell
```

### Regla de dependencias (Clean Architecture)

```
infrastructure/  ──►  application/  ──►  domain/
```

- **`domain/`** no importa absolutamente nada de `application` ni de `infrastructure`. Es Python puro.
- **`application/`** solo conoce el dominio y define **puertos** (interfaces abstractas). No conoce FastAPI, SQLAlchemy ni librerías de infraestructura concretas.
- **`infrastructure/`** implementa los puertos definidos en `application/` y conecta la lógica de negocio con la base de datos, el framework HTTP y el sistema de archivos.

---

## 6. Dependencias y por qué está cada una

### Producción

| Paquete | Para qué |
| ------- | -------- |
| `fastapi` | Framework web rápido y asíncrono para construir la API |
| `uvicorn[standard]` | Servidor ASGI de alto rendimiento para ejecutar FastAPI |
| `SQLAlchemy` | ORM para modelar las tablas y realizar consultas |
| `psycopg2-binary` | Driver PostgreSQL para conexión en contenedores o producción |
| `aiosqlite` | Soporte asíncrono para SQLite |
| `pydantic` | Validación de datos, serialización y tipado estricto |
| `pydantic-settings` | Carga de variables de entorno y configuración tipada |
| `pyjwt` | Generación y validación de tokens de sesión JWT |
| `argon2-cffi` | Algoritmo de hashing seguro y resistente a ataques para contraseñas |
| `python-multipart` | Procesamiento de formularios y subida de archivos multipart/form-data |
| `aiofiles` | Lectura y escritura asíncrona de archivos |
| `colorama` | Formato y colores en logs de consola |

### Desarrollo y Testing

| Paquete | Para qué |
| ------- | -------- |
| `pytest` | Framework de pruebas unitarias y de integración |
| `pytest-cov` | Medición y reporte de cobertura de código |
| `pytest-mock` | Soporte para mocks y espías en los tests |
| `freezegun` | Congelar o simular fechas/horas en pruebas temporales |
| `httpx` | Cliente HTTP utilizado por `TestClient` para testear endpoints sin levantar el servidor |
| `alembic` | Control de versiones y migraciones del esquema de base de datos |

---

## 7. Testing

La suite de pruebas utiliza **Pytest** y cuenta con más de 250 tests automatizados con una cobertura superior al 90%.

### Aislamiento de base de datos en tests
Los tests de integración utilizan una base de datos **SQLite en memoria (`sqlite:///:memory:`)** completamente aislada y efímera gestionada por fixtures en `tests/conftest.py`. Cada test corre sobre una base de datos limpia sin alterar tus archivos locales.

### Comandos de prueba

```bash
# Correr toda la suite con cobertura
pytest

# Correr sin reporte de cobertura (más rápido)
pytest --no-cov

# Correr solo una carpeta o archivo específico
pytest tests/unit/application/test_register_user.py --no-cov

# Correr tests con detalle de fallos corto
pytest --no-cov --tb=short
```

---

## 8. Base de datos y Migraciones

### SQLite (Modo local)
Por defecto, al ejecutar el backend fuera de Docker, SQLAlchemy se conecta a una base de datos SQLite ubicada en `app/infrastructure/database/db.db`. Al iniciar la aplicación, las tablas se generan automáticamente si no existen y se pueblan con los datos semilla (`seed_database`).

### PostgreSQL (Modo Docker)
Al levantar el proyecto completo con Docker Compose (`docker compose up`), el backend se conecta automáticamente al contenedor de PostgreSQL mediante la variable `DATABASE_URL` inyectada en el `docker-compose.yml`.

### Migraciones con Alembic
Para generar y aplicar migraciones manuales en entornos donde se requiera:

```bash
# Generar nueva migración tras modificar un modelo ORM
alembic revision --autogenerate -m "descripcion_del_cambio"

# Aplicar migraciones pendientes
alembic upgrade head
```

---

## 9. Convenciones de código

- **Modelos de dominio:** Clases puras de Python en `app/domain/models/`.
- **Puertos:** Interfaces abstractas en `app/application/ports/` con prefijo `i_` (ej. `i_user_repository.py`).
- **Adaptadores:** Implementaciones concretas en `app/infrastructure/` que implementan las interfaces del puerto.
- **Excepciones de dominio:** Heredan de `DomainException` e indican su mensaje y código de estado HTTP correspondiente (`status_code`).
- **DTOs:** Modelos Pydantic en `app/infrastructure/api/dto/` para validar el payload de solicitudes (`request/`) y estructurar las respuestas (`response/`).
- **Antes de abrir un PR:** Asegurate de correr `pytest` y verificar que la suite completa finalice en verde.

---

## 10. Flujo de trabajo con Git

1. `git pull origin main` antes de empezar cualquier tarea nueva.
2. Crear tu rama con nombre descriptivo: `git switch -c feature/nombre-de-la-funcionalidad`.
3. Hacer tus commits sobre esa rama.
4. Cuando el feature esté listo y los tests pasen, abrir Pull Request contra `main` y asignar como revisor a **@Aguperez444** para cambios en el backend.
5. Una vez aprobada y mergeada la PR, eliminar la rama de trabajo.
