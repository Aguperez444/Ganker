from collections import defaultdict
from fastapi import WebSocket

from app.infrastructure.api.dto.response.message_response import MessageResponse


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

    async def broadcast_to_conversation(self, conversation_id: int, message: MessageResponse) -> None:
        # convierte el mensaje a un modelo JSON para enviarlo a los websockets
        payload = message.model_dump_json()
        # obtengo todos los websockets activos para la conversación de ambos usuarios
        users_in_room = self._active_connections.get(conversation_id, {})

        # Iteramos los sockets de todos los usuarios presentes
        for user_sockets in list(users_in_room.values()):
            # a cada socket de cada usuario de esta conversación le enviamos el mensaje
            for socket in list(user_sockets):
                try:
                    await socket.send_text(payload)
                except Exception:
                    pass  # La desconexión la gestiona el except del endpoint


# Instancia global del manager de conexiones para ser usada en los controladores
chat_manager = ConversationConnectionManager()