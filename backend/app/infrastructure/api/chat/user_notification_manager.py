from collections import defaultdict
from fastapi import WebSocket

class UserNotificationManager:
    def __init__(self):
        # user_id -> set de WebSockets abiertos en sus distintas pestañas
        self._user_sockets: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._user_sockets[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        self._user_sockets[user_id].discard(websocket)
        if not self._user_sockets[user_id]:
            del self._user_sockets[user_id]

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        sockets = list(self._user_sockets.get(user_id, []))
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                self.disconnect(user_id, socket)

notification_manager = UserNotificationManager()