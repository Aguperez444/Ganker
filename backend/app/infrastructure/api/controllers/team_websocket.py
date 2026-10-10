from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.infrastructure.api.teams.teams_feed_connection_manager import teams_feed_manager


router = APIRouter(prefix='/api/v1/ws/teams', tags=['teams Feed'])

@router.websocket('')
async def lobby_feed_endpoint(websocket: WebSocket):
    await teams_feed_manager.subscribe(websocket)
    try:
        while True:
            # Mantiene el socket vivo escuchando pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        teams_feed_manager.unsubscribe(websocket)