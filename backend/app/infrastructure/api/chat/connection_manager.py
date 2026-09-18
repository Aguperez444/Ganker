from collections import defaultdict
from fastapi import WebSocket

from app.infrastructure.api.dto.response.message_response import MessageResponse


class ConversationConnectionManager:
    def __init__(self):
        # conversation_id -> set de WebSockets activos
        self._active_connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, conversation_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active_connections[conversation_id].add(websocket)

    def disconnect(self, conversation_id: int, websocket: WebSocket) -> None:
        # desconecto el websocket de la conversación
        self._active_connections[conversation_id].discard(websocket)
        # si no hay más websockets activos para esa conversación, elimino la entrada del diccionario
        if not self._active_connections[conversation_id]:
            del self._active_connections[conversation_id]

    async def broadcast_to_conversation(self, conversation_id: int, message: MessageResponse) -> None:
        # convierte el mensaje a un modelo JSON para enviarlo a los websockets
        payload = message.model_dump_json()
        # obtengo todos los websockets activos para la conversación
        sockets = list(self._active_connections.get(conversation_id, []))

        # a cada socket le intento enviar el mensaje, si falla lo desconecto
        for socket in sockets:
            try:
                await socket.send_text(payload)
            except Exception:
                self.disconnect(conversation_id, socket)


# Instancia global del manager de conexiones para ser usada en los controladores
chat_manager = ConversationConnectionManager()