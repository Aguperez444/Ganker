from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.create_team_summary_service import DEFAULT_TEAM_ICON_URL
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.infrastructure.api.dto.response.chatroom_response import (
    ChatroomSummaryResponse, ChatroomSummaryItemResponse, ChatroomLastMessageResponse
)


class QueryChatrooms:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def by_user_id(self, user_id: int) -> ChatroomSummaryResponse:
        with self.uow as uow:
            chatrooms = uow.conversation_repo.list_by_user_id(user_id, ConversationTypeEnum.GROUP)
            team_info = uow.team_repo.get_team_info_by_conversation_ids([c.conversation_id for c in chatrooms])

            with_messages: list[ChatroomSummaryItemResponse] = []
            without_messages: list[ChatroomSummaryItemResponse] = []

            for chatroom in chatrooms:
                member = chatroom.get_member(user_id)
                message = chatroom.messages[0] if chatroom.messages else None
                last_message = ChatroomLastMessageResponse(
                    content=message.content,
                    timestamp=message.timestamp,
                    sender_id=message.sender.user_id,
                    sender_username=message.sender.username
                ) if message else None

                team_id, team_icon_url = team_info.get(chatroom.conversation_id, (None, None))
                item = ChatroomSummaryItemResponse(
                    chatroom_id=chatroom.conversation_id,
                    team_id=team_id,
                    icon_url=team_icon_url or DEFAULT_TEAM_ICON_URL,
                    name=chatroom.name,
                    member_count=len(chatroom.members),
                    last_message=last_message,
                    unread_count=uow.message_repo.get_unread_count_after(
                        chatroom.conversation_id, user_id, member.last_read_message_id if member else None
                    )
                )
                (with_messages if last_message else without_messages).append(item)

            # Los chatrooms con actividad más reciente primero
            with_messages.sort(key=lambda i: i.last_message.timestamp, reverse=True)
            return ChatroomSummaryResponse(chatrooms=with_messages + without_messages)
