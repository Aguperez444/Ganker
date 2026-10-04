from fastapi import WebSocket

class TeamFeedConnectionManager:
    def __init__(self):
        # Sockets de todos los usuarios que están mirando el listado de salas
        self._viewers: set[WebSocket] = set()

    async def subscribe(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._viewers.add(websocket)

    def unsubscribe(self, websocket: WebSocket) -> None:
        self._viewers.discard(websocket)

    async def broadcast_event(self, event_type: str, data: dict) -> None:
        payload = {"type": event_type, "data": data}
        for ws in list(self._viewers):
            try:
                await ws.send_json(payload)
            except Exception:
                self.unsubscribe(ws)

teams_feed_manager = TeamFeedConnectionManager()