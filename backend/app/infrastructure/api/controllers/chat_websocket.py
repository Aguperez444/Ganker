from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.infrastructure.api.chat.user_notification_manager import notification_manager
from app.infrastructure.api.dto.response.notification_type_enum import NotificationType
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

from app.application.use_cases.check_conversation_access import CheckConversationAccessUseCase
from app.application.use_cases.save_message import SaveMessageUseCase
from app.infrastructure.api.dto.request.send_message_request import SendMessageRequest
from app.infrastructure.api.dto.response.message_response import MessageResponse
from app.infrastructure.api.dto.response.notification_response import NotificationResponse

from app.infrastructure.api.chat.connection_manager import chat_manager
from app.infrastructure.api.dependencies.web_socket_auth import get_current_user_id_ws

router = APIRouter(prefix="/api/v1/ws/chat", tags=["Websocket Chat"])

@router.websocket("/conversations/{conversation_id}")
async def websocket_chat_endpoint(
        websocket: WebSocket,
        conversation_id: int,
        user_id: int = Depends(get_current_user_id_ws)):

    uow = uow_factory()
    access_use_case = CheckConversationAccessUseCase(uow)
    save_message_use_case = SaveMessageUseCase(uow)

    # 1. Validación de seguridad previa: ¿El usuario es player_1 o player_2?
    has_access, recipient_id = await run_in_threadpool(access_use_case.execute, conversation_id, user_id)
    if not has_access:
        # 1008 = Policy Violation (cierra la conexión de inmediato)
        recipient_id = None
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not recipient_id:
        raise ValueError("No se pudo determinar el ID del destinatario.") # TODO crear domain exception

    # 2. Conexión aceptada
    await chat_manager.connect(conversation_id, user_id, websocket)

    try:
        while True:
            raw_text = await websocket.receive_text()

            # 3. Validación del DTO entrante con Pydantic
            try:
                request_dto = SendMessageRequest.model_validate_json(raw_text)
            except ValidationError as err:
                await websocket.send_json({"error": "Payload inválido", "details": err.errors()})
                continue

            # 4. Comprobamos en RAM si el destinatario está con el chat abierto para marcar el mensaje como leído o no
            is_recipient_present = chat_manager.is_user_online_in_conversation(conversation_id, recipient_id)

            # 5. Guardar mensaje de forma síncrona en hilo separado
            saved_message: MessageResponse = await run_in_threadpool(
                save_message_use_case.execute,
                conversation_id = conversation_id,
                sender_id = user_id,
                content = request_dto.content,
                is_read = is_recipient_present
            )

            # 6. Broadcast a ambos participantes
            await chat_manager.broadcast_to_conversation(conversation_id, saved_message)

            # 7. Crear notificación para el destinatario
            notification = NotificationResponse(
                type=NotificationType.NEW_MESSAGE,
                conversation_id=conversation_id,
                sender_id=user_id,
                content=saved_message.content,
                timestamp=saved_message.timestamp.isoformat())

            # 8. Enviar notificación al destinatario
            await notification_manager.send_to_user(recipient_id, notification.model_dump())

    except WebSocketDisconnect:
        chat_manager.disconnect(conversation_id, user_id, websocket)