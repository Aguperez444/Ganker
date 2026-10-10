from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.message import Message
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.infrastructure.api.dto.response.conversation_summary_response import ConversationSummaryResponse, \
    ConversationSummaryItemResponse, LastMessageResponse, ParticipantSummaryResponse

class QueryConversations:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def by_user_id(self, user_id: int) -> ConversationSummaryResponse:
        with self.uow as uow:
            conversations =  uow.conversation_repo.list_by_user_id(user_id)
            conversations_summary_objects = []

            for conversation in conversations:
                message: Message | None = conversation.messages[0] if conversation.messages else None
                last_message = LastMessageResponse(content=message.content,
                                                   timestamp=message.timestamp,
                                                   sender_id=message.sender.user_id,
                                                   is_read=message.is_read) if message else None
                unread_count = uow.message_repo.get_unread_count_by_conversation_id(conversation.conversation_id, user_id)

                if conversation.conversation_type == ConversationTypeEnum.PRIVATE:
                    other_user = conversation.get_other_user(user_id)
                    other_participant = ParticipantSummaryResponse(
                        user_id=other_user.user_id,
                        username=other_user.username,
                        name=other_user.name,
                        icon_url=other_user.icon_url if other_user.icon_url else ""
                    )


                    summary = ConversationSummaryItemResponse(conversation_id=conversation.conversation_id,
                                                              other_participant=other_participant, last_message=last_message,
                                                              unread_count=unread_count)
                    conversations_summary_objects.append(summary)

        return ConversationSummaryResponse(conversations=conversations_summary_objects)
