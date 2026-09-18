from typing import cast

from fastapi import APIRouter, Depends, status

from app.application.use_cases.get_or_create_conversation import GetOrCreateConversationUseCase
from app.application.use_cases.query_conversation import QueryConversations
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player
from app.infrastructure.api.dto.request.start_conversation_request import StartConversationRequest
from app.infrastructure.api.dto.response.conversation_summary_response import ConversationSummaryResponse
from app.infrastructure.api.dto.response.create_conversation_summary_response import CreateconversationSummaryResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

@router.post("", response_model=CreateconversationSummaryResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(require_player)])
def start_or_get_conversation(payload: StartConversationRequest, current_user_id: int = Depends(get_current_user_id)):

    uow = uow_factory()
    use_case = GetOrCreateConversationUseCase(uow)
    conversation = use_case.execute(
        current_user_id=current_user_id,
        target_user_id=payload.target_user_id
    )

    return CreateconversationSummaryResponse(
        conversation_id=cast(int, conversation.conversation_id),
        player_1_id=cast(int, conversation.user_1.user_id),
        player_2_id=cast(int, conversation.user_2.user_id)
    )



@router.get("/conversations", response_model=ConversationSummaryResponse, dependencies=[Depends(require_player)])
def get_my_conversations(current_user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    query_conversations = QueryConversations(uow)
    return query_conversations.by_user_id(current_user_id)




