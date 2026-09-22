from typing import cast

from fastapi import APIRouter, Depends, status
from starlette.concurrency import run_in_threadpool

from app.application.use_cases.get_messages import GetMessages
from app.application.use_cases.get_or_create_conversation import GetOrCreateConversationUseCase
from app.application.use_cases.mark_as_read import MarkAsRead
from app.application.use_cases.query_conversation import QueryConversations
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player
from app.infrastructure.api.dto.request.start_conversation_request import StartConversationRequest
from app.infrastructure.api.dto.response.conversation_summary_response import ConversationSummaryResponse
from app.infrastructure.api.dto.response.create_conversation_summary_response import CreateConversationSummaryResponse
from app.infrastructure.api.dto.response.get_messages_response import GetMessagesResponse
from app.infrastructure.api.dto.response.messages_read_notification_response import MessagesReadNotificationResponse
from app.infrastructure.api.dto.response.notification_type_enum import NotificationType
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.api.chat.connection_manager import chat_manager

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

@router.post("", response_model=CreateConversationSummaryResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(require_player)])
def start_or_get_conversation(payload: StartConversationRequest, current_user_id: int = Depends(get_current_user_id)):

    uow = uow_factory()
    use_case = GetOrCreateConversationUseCase(uow)
    conversation = use_case.execute(
        current_user_id=current_user_id,
        target_user_id=payload.target_user_id
    )

    return CreateConversationSummaryResponse(
        conversation_id=cast(int, conversation.conversation_id),
        player_1_id=cast(int, conversation.user_1.user_id),
        player_2_id=cast(int, conversation.user_2.user_id)
    )



@router.get("/conversations", response_model=ConversationSummaryResponse, dependencies=[Depends(require_player)])
def get_my_conversations(current_user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    query_conversations = QueryConversations(uow)
    return query_conversations.by_user_id(current_user_id)


@router.get("/conversations/{conversation_id}/messages", response_model=GetMessagesResponse, dependencies=[Depends(require_player)])
def get_messages(conversation_id: int, size: int = 30, page: int = 1, current_user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    get_messages_use_case = GetMessages(uow)
    return get_messages_use_case.execute(conversation_id, current_user_id, page, size)


@router.patch("/conversations/{conversation_id}/read", status_code=status.HTTP_200_OK, dependencies=[Depends(require_player)])
async def mark_conversation_as_read(conversation_id: int, current_user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    mark_as_read_use_case = MarkAsRead(uow)
    updated_count = await run_in_threadpool(mark_as_read_use_case.execute,conversation_id, current_user_id)

    if updated_count > 0:
        notification = MessagesReadNotificationResponse(type=NotificationType.MESSAGES_READ, conversation_id=conversation_id, read_by=current_user_id)
        await chat_manager.broadcast_to_conversation(conversation_id, notification)

    return {"status": "ok", "messages_marked": updated_count}