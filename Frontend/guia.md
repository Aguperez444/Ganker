# Guía de Integración Frontend - Equipos y Salas de Chat (Lobby)

Esta guía detalla cómo el equipo de Frontend debe conectarse e interactuar con los nuevos endpoints y WebSockets desarrollados para el sistema de búsqueda, creación y unión a equipos (Lobby), así como la integración con el chat grupal automático.

---

## 1. Buscar Equipos (Lobby)

El feed principal donde se muestran todos los equipos disponibles con cupos.

**Endpoint:** `GET /api/v1/teams`
**Autenticación:** Requerida (Bearer Token).

### Query Parameters (Filtros Opcionales)

Todos los filtros son opcionales. Puedes enviar combinaciones de ellos. Si no envías ninguno, retornarás todos los equipos que actualmente **tengan vacantes**.

- `videogame_id` (int)
- `region_id` (int)
- `rank_id` (int): Busca equipos cuyo rango mínimo y máximo engloben este rank.
- `vacant_slots` (int): Retorna equipos que tengan _al menos_ esta cantidad de espacios libres.
- `role_id` (int): Retorna equipos que tengan una vacante libre buscando específicamente este rol.
- `search` (str): Busca coincidencias textuales en el nombre o la descripción del equipo.

### Respuesta

Retorna un array (`List`) de objetos `TeamSummaryResponse`.

```json
[
  {
    "team_id": 1,
    "team_name": "Los Gankers",
    "description": "Buscamos mid tryhard",
    "player_count": 1,
    "max_players": 5,
    "members": [
      {
        "user_id": 42,
        "username": "Faker",
        "name": "Lee Sang-hyeok",
        "icon_url": "/media/icons/faker.png",
        "active_game_profile": {
          "region_name": "KR",
          "active_role_profile": {
            "role_name": "Mid",
            "rank_name": "Challenger",
            "rank_icon_url": "/media/ranks/challenger.png"
          }
        }
      },
      {
        "user_id": null,
        "username": "Libre",
        "name": "Libre",
        "icon_url": "/media/roles/jungler.png",
        "active_game_profile": {
          "region_name": "KR",
          "active_role_profile": {
            "role_name": "Jungler",
            "rank_name": "",
            "rank_icon_url": "/media/ranks/empty_rank_icon.png"
          }
        }
      }
    ]
  }
]
```

_(Nota: Si `user_id` viene en `null`, significa que es un slot vacante. En la UI pueden pintar la carta de "Vacante" usando el `role_name` o el `icon_url` del rol)._

---

## 2. Feed en Tiempo Real del Lobby (WebSocket)

Para que el Lobby se sienta vivo y los jugadores vean cuando un equipo se crea o se llena sin recargar la página, deben conectarse a este WebSocket apenas entren a la vista de búsqueda.

**Endpoint WS:** `ws://<host>/api/v1/ws/teams`
_(Nota: Pongan un `setInterval` o mecanismo que envíe cualquier texto por el socket cada X segundos para mantener la conexión viva con el servidor y evitar timeouts)._

### Eventos que emite el Backend

El backend enviará un JSON por cada actualización en las salas. Suscríbanse a este socket para actualizar su array de react/vue en vivo:

**A. Creación de un nuevo equipo**

```json
{
  "type": "TEAM_CREATED",
  "data": { ... TeamSummaryResponse ... } // Añadan esto al principio de su lista en el frontend
}
```

**B. Alguien se unió a un equipo**

```json
{
  "type": "TEAM_MEMBER_JOINED",
  "data": { ... TeamSummaryResponse ... } // Reemplacen el equipo viejo en su lista por este actualizado
}
```

---

## 3. Crear un Equipo

**Endpoint:** `POST /api/v1/teams`
**Autenticación:** Requerida (Bearer Token).

### Body

```json
{
  "name": "Team Tryhard",
  "description": "Jugamos todas las noches a las 22hs",
  "allow_other_regions": false,
  "videogame_id": 1,
  "region_id": 2, // Opcional (enviar null si allow_other_regions es true)
  "min_rank_id": 1,
  "max_rank_id": 5,
  "creator_game_role_id": 3,
  "vacant_game_role_ids": [4, 5, 2] // Agregan el rol deseado para cada slot vacante extra
}
```

**Regla de negocio:** Si el jugador no elige región (`region_id: null`), `allow_other_regions` debe ser obligatoriamente `true`, caso contrario el backend regresará un HTTP 400.

**Respuesta:** Devuelve un HTTP 201 Created con el `TeamSummaryResponse`. Automáticamente el backend crea el Chatroom grupal internamente.

---

## 4. Unirse a un Equipo

Desde la UI de la tarjeta del equipo, si el jugador escoge un rol vacante e intenta unirse.
_(Nota: Siéntanse libres de permitir que el jugador apriete el botón. Si no cumple los requisitos, el backend regresará un HTTP 400 con un mensaje de error limpio)._

**Endpoint:** `POST /api/v1/teams/{team_id}/join`
**Autenticación:** Requerida (Bearer Token).

### Body

Deben enviar el ID del ROL DENTRO DEL EQUIPO (es decir, el ID que representa la vacante a la cual están aplicando). Este rol debe existir en el juego seleccionado.

```json
{
  "target_team_member_role_id": 5
}
```

**Respuesta Exitosa (HTTP 200):**

```json
{
  "status": "success",
  "data": { ... TeamSummaryResponse actualizado ... }
}
```

**Posibles Errores Comunes (HTTP 400):**

- `InvalidRegionException`: Región incompatible.
- `InvalidrankException`: Rango del jugador fuera de los límites exigidos.
- `RoleAlreadyOcupiedException`: Alguien le ganó el cupo un microsegundo antes.
- `UserAlreadyInTeamException`: El usuario ya tiene un equipo activo en este momento.

---

## 5. Integración con el Chat Grupal

A nivel frontend, la conexión al chat grupal de un equipo **no requiere desarrollar nada nuevo**.
El backend lo abstrae utilizando el sistema de `Conversations` que ya tienen programado.

1. Al momento en que un jugador "Crea un Equipo" o hace "Join" exitosamente, el backend automáticamente lo introduce en un `Conversation` de tipo `GROUP`.
2. Para mostrar el chat del equipo en la interfaz, su front-end simplemente debe volver a llamar a su endpoint existente:
   **`GET /api/v1/chat/conversations`**
   Y allí aparecerá una nueva conversación llamada `Chat de equipo: {team_name}`.
3. El frontend podrá conectarse al WebSocket de chat de siempre para mandar mensajes con esa sala como si de un chat normal se tratase:
   `ws://<host>/api/v1/ws/chat/conversations/{conversation_id}?token=...`

Todo es transparente. El feed del Lobby actualiza visualmente la pestaña de búsqueda de equipos, y el chat utiliza sus integraciones de mensajería actuales de la app.
