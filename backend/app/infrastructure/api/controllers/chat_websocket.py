from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.infrastructure.api.chat.user_notification_manager import notification_manager
from app.infrastructure.api.dto.response.notification.notification_type_enum import NotificationType
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

from app.application.use_cases.check_conversation_access import CheckConversationAccess
from app.application.use_cases.check_chatroom_access import CheckChatroomAccess
from app.application.use_cases.save_message import SaveMessage
from app.application.use_cases.send_chatroom_message import SendChatroomMessage
from app.infrastructure.api.dto.request.send_message_request import SendMessageRequest
from app.infrastructure.api.dto.response.message_response import MessageResponse
from app.infrastructure.api.dto.response.notification.notification_response import NotificationResponse

from app.infrastructure.api.chat.connection_manager import chat_manager
from app.infrastructure.api.dependencies.web_socket_auth import get_current_user_id_ws
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.chat.message_is_empty_exception import MessageIsEmptyException
from app.domain.exceptions.chat.recipient_not_found_exception import RecipientNotFoundException

router = APIRouter(prefix="/api/v1/ws/chat", tags=["Websocket Chat"])

@router.websocket("/conversations/{conversation_id}")
async def websocket_chat_endpoint(
        websocket: WebSocket,
        conversation_id: int,
        user_id: int = Depends(get_current_user_id_ws)):

    uow = uow_factory()
    access_use_case = CheckConversationAccess(uow)
    save_message_use_case = SaveMessage(uow)

    # 1. Validación de seguridad previa: ¿El usuario es player_1 o player_2?
    has_access, recipient_id = await run_in_threadpool(access_use_case.execute, conversation_id, user_id)
    if not has_access:
        # 1008 = Policy Violation (cierra la conexión de inmediato)
        # noinspection unused-local
        recipient_id = None
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not recipient_id:
        raise RecipientNotFoundException(conversation_id)

    # 2. Conexión aceptada
    await chat_manager.connect(conversation_id, user_id, websocket)

    try:
        while True:
            raw_text = await websocket.receive_text()

            # 3. Validación del DTO entrante con Pydantic
            try:
                request_dto = SendMessageRequest.model_validate_json(raw_text)
            except (ValidationError, MessageIsEmptyException) as err:
                await websocket.send_json({"error": "El mensaje enviado no puede estar vacío", "details": str(err)})
                continue

            # 4. Comprobamos en RAM si el destinatario está con el chat abierto para marcar el mensaje como leído o no
            is_recipient_present = chat_manager.is_user_online_in_conversation(conversation_id, recipient_id)

            # 5. Guardar mensaje de forma síncrona en hilo separado
            try:
                saved_message: MessageResponse = await run_in_threadpool(
                    save_message_use_case.execute,
                    conversation_id = conversation_id,
                    sender_id = user_id,
                    content = request_dto.content,
                    is_read = is_recipient_present
                )
            except MessageIsEmptyException as err:
                await websocket.send_json({"error": err.message})
                continue

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


@router.websocket("/chatroom/{chatroom_id}")
async def websocket_chatroom_endpoint(
        websocket: WebSocket,
        chatroom_id: int,
        user_id: int = Depends(get_current_user_id_ws)):

    uow = uow_factory()
    has_access_use_case = CheckChatroomAccess(uow)
    send_message_use_case = SendChatroomMessage(uow)

    # 1. Solo los miembros del equipo pueden conectarse al chatroom
    if not await run_in_threadpool(has_access_use_case.execute, chatroom_id, user_id):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await chat_manager.connect(chatroom_id, user_id, websocket)

    try:
        while True:
            raw_text = await websocket.receive_text()

            try:
                request_dto = SendMessageRequest.model_validate_json(raw_text)
            except (ValidationError, MessageIsEmptyException) as err:
                await websocket.send_json({"error": "El mensaje enviado no puede estar vacío", "details": str(err)})
                continue

            # Los miembros con el chatroom abierto reciben el mensaje ya como leído
            online_user_ids = chat_manager.get_online_user_ids(chatroom_id)

            try:
                saved_message, member_ids = await run_in_threadpool(
                    send_message_use_case.execute,
                    chatroom_id=chatroom_id,
                    sender_id=user_id,
                    content=request_dto.content,
                    online_user_ids=online_user_ids
                )
            except MessageIsEmptyException as err:
                await websocket.send_json({"error": err.message})
                continue
            except DomainException as err:
                # Por ejemplo, el usuario dejó de ser miembro del chatroom
                await websocket.send_json({"error": err.message})
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                chat_manager.disconnect(chatroom_id, user_id, websocket)
                return

            await chat_manager.broadcast_to_conversation(chatroom_id, saved_message)

            # Notificamos a los miembros que no tienen el chatroom abierto
            notification = NotificationResponse(
                type=NotificationType.NEW_CHATROOM_MESSAGE,
                conversation_id=chatroom_id,
                sender_id=user_id,
                content=saved_message.content,
                timestamp=saved_message.timestamp.isoformat())
            for member_id in member_ids:
                if member_id != user_id and member_id not in online_user_ids:
                    await notification_manager.send_to_user(member_id, notification.model_dump())

    except WebSocketDisconnect:
        chat_manager.disconnect(chatroom_id, user_id, websocket)
