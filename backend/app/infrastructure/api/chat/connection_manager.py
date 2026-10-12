from collections import defaultdict
from fastapi import WebSocket
from pydantic import BaseModel


class ConversationConnectionManager:
    def __init__(self):
        # conversation_id -> set de WebSockets activos
        self._active_connections: dict[int, dict[int, set[WebSocket]]] = defaultdict(lambda: defaultdict(set))

    async def connect(self, conversation_id: int, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active_connections[conversation_id][user_id].add(websocket)

    def disconnect(self, conversation_id: int, user_id: int, websocket: WebSocket) -> None:
        # desconecto el websocket de la conversación
        self._active_connections[conversation_id][user_id].discard(websocket)
        # Limpieza si el usuario no tiene más pestañas abiertas
        if not self._active_connections[conversation_id][user_id]:
            del self._active_connections[conversation_id][user_id]

        # Limpieza si no queda nadie en la conversación
        if not self._active_connections[conversation_id]:
            del self._active_connections[conversation_id]

    def is_user_online_in_conversation(self, conversation_id: int, user_id: int) -> bool:
        """Verifica en memoria si el usuario tiene al menos una conexión activa en esta sala."""
        return bool(self._active_connections.get(conversation_id, {}).get(user_id))

    def get_online_user_ids(self, conversation_id: int) -> set[int]:
        """IDs de los usuarios con al menos una conexión activa en la sala."""
        return set(self._active_connections.get(conversation_id, {}).keys())

    async def broadcast_to_conversation(
        self,
        conversation_id: int,
        message: BaseModel,
        allowed_user_ids: set[int] | list[int] | None = None,
    ) -> None:
        # convierte el mensaje a un modelo JSON para enviarlo a los websockets
        payload = message.model_dump_json()
        # obtengo todos los websockets activos para la conversación de los usuarios
        users_in_room = self._active_connections.get(conversation_id, {})
        allowed_set = set(allowed_user_ids) if allowed_user_ids is not None else None

        # Iteramos los sockets de todos los usuarios presentes
        for user_id, user_sockets in list(users_in_room.items()):
            # Si se especificó una lista de usuarios autorizados y el usuario ya no pertenece,
            # cerramos sus sockets y evitamos enviarle el mensaje
            if allowed_set is not None and user_id not in allowed_set:
                for socket in list(user_sockets):
                    try:
                        await socket.close(code=1008, reason="Ya no perteneces a esta conversación")
                    except Exception:
                        pass
                if user_id in self._active_connections.get(conversation_id, {}):
                    del self._active_connections[conversation_id][user_id]
                continue

            # a cada socket de cada usuario de esta conversación le enviamos el mensaje
            for socket in list(user_sockets):
                # noinspection broad-exception
                try:
                    await socket.send_text(payload)
                except Exception:
                    pass  # La desconexión la gestiona el except del endpoint

    async def close_user_in_conversation(
        self,
        conversation_id: int,
        user_id: int,
        code: int = 1008,
        reason: str = "Acceso revocado",
    ) -> None:
        """Cierra todos los WebSockets activos de un usuario específico en una conversación."""
        users_in_room = self._active_connections.get(conversation_id, {})
        user_sockets = list(users_in_room.get(user_id, set()))
        for socket in user_sockets:
            # noinspection broad-exception
            try:
                await socket.close(code=code, reason=reason)
            except Exception:
                pass

        if conversation_id in self._active_connections:
            if user_id in self._active_connections[conversation_id]:
                del self._active_connections[conversation_id][user_id]
            if not self._active_connections[conversation_id]:
                del self._active_connections[conversation_id]

    async def close_conversation(self, conversation_id: int) -> None:
        """Cierra todos los WebSockets conectados a esta conversación y la remueve del mapa."""
        users_in_room = self._active_connections.get(conversation_id, {})
        for user_sockets in list(users_in_room.values()):
            for socket in list(user_sockets):
                # noinspection broad-exception
                try:
                    await socket.close(code=1000, reason="Chatroom cerrado")
                except Exception:
                    pass
        if conversation_id in self._active_connections:
            del self._active_connections[conversation_id]


# Instancia global del manager de conexiones para ser usada en los controladores
chat_manager = ConversationConnectionManager()