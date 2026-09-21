from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.infrastructure.api.dependencies.web_socket_auth import get_current_user_id_ws
from app.infrastructure.api.chat.user_notification_manager import notification_manager

router = APIRouter(prefix="/ws/notifications", tags=["notifications"])

@router.websocket('')
async def user_notifications_endpoint(websocket: WebSocket,user_id: int = Depends(get_current_user_id_ws)):
    await notification_manager.connect(user_id, websocket)
    try:
        while True:
            # Mantiene el socket vivo escuchando pings/mensajes del cliente
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)