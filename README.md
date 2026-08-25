# Repositorio Ganker
---
## Estructura del repositorio

```
Ganker/
├── backend/                               # Backend del proyecto
│   └── app/                               # Codigo fuente
│       ├── application/                   # Puertos y adaptadores necesarios y los useCases del 
│       │     ├── ports/                   # Puertos (interfaces necesarias)
│       │     └── useCases/                # Casos de uso
│       ├── domain/                        # Clases del dominio del problema
│       │   ├── models/                    # Modelos para las clases
│       │   └── services/                  # Funciones que pueden/deben ser reutilizadas desde multiples puntos
│       └── infrastructure/                # Clases técnicas de dependencias externas
│           ├── Api/                       # Api para comunicarse con el frontend
│           │     ├── controllers/         # distintos controllers para cada ruta
│           │     └── dto/                 # data transfer objects (para enviar/recibir json)
│           ├── Database/                  # infrastructura de la base de datos, todas las clases de soporte necesarias
│           │     ├── models/              # models del ORM
│           │     ├── repositories/        # repositorios
│           │     ├── unit_of_work/        # implementacion y factory del unit of work de sqlAlchemy
│           │     └── mappers/             # mappers para los models
│           └── start/                     # starters para arrancar el backend de distintas formas        
│         
├── Frontend/                              # Frontend del proyecto
    ├── Public/                           # Archivos estaticos,fuentes,logo,etc
    │   ├── images/                        # Imagenes del proyecto
    │
    └── src/                               # Codigo fuente
        ├── api/                           # Axios y conexión con el backend
        ├── hooks/                         # Lógica de aplicación (estado + orquestación de datos)
        ├── context/                       # Estado global (sesión, chat)
        ├── components/                    # Componentes genericos reutilizables
        │   ├── common/                    # botones, inputs, modales, spinners,etc
        │   ├── jugadores/                 # JugadorCard, JugadorForm, JugadorList
        │   ├── equipos/
        │   └── chat/                      # ChatWindow, MessageBubble, MessageInput
        ├── pages/                         # Vistas completas (arman hooks + components)
        ├── routes/                        # Definición y protección de rutas
        ├── utils/                         # Funciones puras (validaciones, formateo, constantes)
        ├── App.jsx
        └── main.jsx


```


---

## Reglas de Nombrado

**Archivos y carpetas:** Nombres descriptivos en minúscula y separados por guión bajo (_).

| Ítem de configuración         | Regla de nombrado                                   |
|-------------------------------|-----------------------------------------------------|
| Archivos de python generales  | `nombre_del_archivo.py`                             |
| Interfaces                    | `Inombre_de_la_interfaz.py`                         |
| Implementaciones de interfaz  | `nombre_de_la_interfaz_impl.py`                     |
| Mappers de orm                | `nombre_entidad_mapper.py`                          |
| models del orm                | `nombre_entidad_orm.py`                             |
| Dto de solicitud              | `request_nombre_recurso.py`                         |
| Dto de respuesta              | `response_nombre_recurso.py`                        |
| Archivos de JS generales      | `nombreDelArchivo.js`                               |
| Páginas                       | `nombreDePaginaPage.js`                             |
| Components                    | `nombreDeComponenteComponent.js`                    |



---

## Flujo de trabajo

1. Siempre hacer `git pull origin main` antes de comenzar a trabajar en algo nuevo
2. cambiar a una rama propia con `git switch -c <nombre de la rama>` (que el nombre de la rama sea minimamente descriptivo de lo que están haciendo)
3. hacer sus commits sobre esa rama hasta que el feature esté listo
4. Cuando el feature esté listo tirar pull request a `@Aguperez444` para cambios en el **backend**, o a `@franleal` en caso de cambios en el **frontend**
5. Una vez aprobada la pull request e introudcida la feature al main, borrar la rama que se creo para desarollo de esa feature

