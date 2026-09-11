# Repositorio de Ganker

---

## Estructura del repositorio

```
Ganker/
├── backend/                               # Backend del proyecto
│   ├── app/                               # Codigo fuente
│   │    ├── application/                  # Puertos y adaptadores necesarios y los useCases del
│   │    │     ├── ports/                  # Puertos (interfaces necesarias)
│   │    │     └── use_cases/              # Casos de uso
│   │    ├── domain/                       # Clases del dominio del problema
│   │    │   ├── models/                   # Modelos para las clases
│   │    │   ├── exceptions/               # Excepciones propias del dominio, subdivididas en carpetas de acuerdo a la entidad que provoca la extensión
│   │    │   └── services/                 # Funciones que pueden/deben ser reutilizadas desde multiples puntos
│   │    └── infrastructure/               # Clases técnicas de dependencias externas
│   │       ├── api/                       # Api para comunicarse con el frontend
│   │       │     ├── auth/                # Implementacion de los puertos de seguridad/authenticación de usuarios
│   │       │     ├── dependencies/        # Dependencias comunes para varios endpoints, declaraciones de permisos, etc.
│   │       │     ├── controllers/         # Distintos controllers para cada ruta
│   │       │     └── dto/                 # Data transfer objects (para enviar/recibir json)
│   │       │         ├── request          # Para las request que llegan del frontend
│   │       │         └── response/        # Para las respuestas que entrega el backend
│   │       ├── config/                    # Archivos de configuración de entorno
│   │       ├── database/                  # Infrastructura de la base de datos, todas las clases de soporte necesarias
│   │       │     ├── models/              # Models del ORM
│   │       │     ├── repositories/        # Repositorios
│   │       │     ├── unit_of_work/        # Implementacion y factory del unit of work de sqlAlchemy
│   │       │     └── mappers/             # Mappers para los models
│   │       ├── start/                     # Starters para arrancar el backend de distintas formas
│   │       └── storage/                   # Implementación de los puertos para persistencia de archivos
│   ├── migrations/                        # Configuración de alembic para migraciones de la bdd 
│   └── tests/                             # Suite de tests con pytest
│       ├── integration/ 
│       └── unit/
├── Frontend/                              # Frontend del proyecto
│    ├── Public/                           # Archivos estaticos,fuentes,logo,etc
│    │   └── images/                       # Imagenes del proyecto
│    └── src/                              # Codigo fuente
│       ├── api/                           # Axios y conexión con el backend
│       ├── hooks/                         # Lógica de aplicación (estado + orquestación de datos)
│       ├── context/                       # Estado global (sesión, chat)
│       ├── components/                    # Componentes genericos reutilizables
│       │   ├── common/                    # botones, inputs, modales, spinners,etc
│       │   ├── jugadores/                 # JugadorCard, JugadorForm, JugadorList
│       │   ├── equipos/
│       │   └── chat/                      # ChatWindow, MessageBubble, MessageInput
│       ├── pages/                         # Vistas completas (arman hooks + components)
│       ├── routes/                        # Definición y protección de rutas
│       ├── utils/                         # Funciones puras (validaciones, formateo, constantes)
│       ├── App.jsx
│       └── main.jsx
└── nginx                                  # configuración del nginx como reverse proxy para servir las imagenes desde el backend

```

---

## Reglas de Nombrado

**Archivos y carpetas:** Nombres descriptivos en minúscula y separados por guión bajo (\_).

| Ítem de configuración        | Regla de nombrado                |
| ---------------------------- | -------------------------------- |
| Archivos de python generales | `nombre_del_archivo.py`          |
| Interfaces                   | `i_nombre_de_la_interfaz.py`     |
| Implementaciones de interfaz | `nombre_de_la_interfaz_impl.py`  |
| Mappers de orm               | `nombre_entidad_mapper.py`       |
| models del orm               | `nombre_entidad_orm.py`          |
| Dto de solicitud             | `nombre_recurso_request.py`      |
| Dto de respuesta             | `nombre_recurso_response.py`     |
| Archivos de JS generales     | `nombreDelArchivo.js`            |
| Páginas                      | `nombreDePaginaPage.js`          |
| Components                   | `nombreDeComponenteComponent.js` |

---

## Flujo de trabajo

1. Siempre hacer `git pull origin main` antes de comenzar a trabajar en algo nuevo
2. cambiar a una rama propia con `git switch -c <nombre de la rama>` (que el nombre de la rama sea minimamente descriptivo de lo que están haciendo)
3. hacer sus commits sobre esa rama hasta que el feature esté listo
4. Cuando el feature esté listo tirar pull request a `@Aguperez444` para cambios en el **backend**, o a `@franleal` en caso de cambios en el **frontend**
5. Una vez aprobada la pull request e introudcida la feature al main, borrar la rama que se creo para desarollo de esa feature
