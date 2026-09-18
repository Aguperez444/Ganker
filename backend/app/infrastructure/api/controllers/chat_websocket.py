from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

from app.application.use_cases.check_conversation_access import CheckConversationAccessUseCase
from app.application.use_cases.save_message import SaveMessageUseCase
from app.infrastructure.api.dto.request.send_message_request import SendMessageRequest
from app.infrastructure.api.dto.response.message_response import MessageResponse


from app.infrastructure.api.chat.connection_manager import chat_manager
from app.infrastructure.api.dependencies.web_socket_auth import get_current_user_id_ws

router = APIRouter(prefix="/api/v1/ws", tags=["Websocket Chat"])

@router.websocket("/conversations/{conversation_id}")
async def websocket_chat_endpoint(
        websocket: WebSocket,
        conversation_id: int,
        user_id: int = Depends(get_current_user_id_ws)):

    uow = uow_factory()
    access_use_case = CheckConversationAccessUseCase(uow)
    save_message_use_case = SaveMessageUseCase(uow)

    # 1. Validación de seguridad previa: ¿El usuario es player_1 o player_2?
    has_access = await run_in_threadpool(access_use_case.execute, conversation_id, user_id)
    if not has_access:
        # 1008 = Policy Violation (cierra la conexión de inmediato)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Conexión aceptada
    await chat_manager.connect(conversation_id, websocket)

    try:
        while True:
            raw_text = await websocket.receive_text()

            # 3. Validación del DTO entrante con Pydantic
            try:
                request_dto = SendMessageRequest.model_validate_json(raw_text)
            except ValidationError as err:
                await websocket.send_json({"error": "Payload inválido", "details": err.errors()})
                continue

            # 4. Guardar mensaje de forma síncrona en hilo separado
            saved_message: MessageResponse = await run_in_threadpool(
                save_message_use_case.execute,
                conversation_id,
                user_id,
                request_dto.content
            )

            # 5. Broadcast a ambos participantes
            await chat_manager.broadcast_to_conversation(conversation_id, saved_message)

    except WebSocketDisconnect:
        chat_manager.disconnect(conversation_id, websocket)