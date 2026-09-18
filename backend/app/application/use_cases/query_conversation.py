from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.conversation_summary_response import ConversationSummaryResponse, ConversationItemResponse, LastMessageResponse, ParticipantSummaryResponse

from typing import cast

from app.domain.models.message import Message
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException


class QueryConversations:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def by_user_id(self, user_id: int) -> ConversationSummaryResponse:
        # busco todas las conversaciones del usuario
        with self.uow as uow:
            conversations =  uow.conversation_repo.list_by_user_id(user_id)

            conversations_summary_objects = []

            # de cada conversación del usuario
            for conversation in conversations:
                # obtengo el último mensaje de la conversación
                message: Message | None = conversation.messages[0] if conversation.messages else None
                last_message = LastMessageResponse(content=message.content,
                                                   timestamp=message.timestamp,
                                                   sender_id=cast(int, message.sender.user_id)) if message else None

                # obtengo el otro participante de la conversación
                other_user_id = conversation.user_1.user_id if conversation.user_1.user_id != user_id else conversation.user_2.user_id
                other_user = uow.user_repo.get_user_by_id(cast(int,other_user_id))

                if not other_user:
                    raise UserNotFoundException(other_user_id)

                other_participant = ParticipantSummaryResponse(
                    user_id=cast(int, other_user.user_id),
                    username=other_user.username,
                    name=other_user.name,
                    icon_url=other_user.icon_url
                )

                # armo el objeto con el último mensaje y el otro participante
                summary = ConversationItemResponse(conversation_id=cast(int, conversation.conversation_id),
                                         other_participant=other_participant,last_message=last_message)

                # añado el resumen de la conversación a la lista
                conversations_summary_objects.append(summary)

        return ConversationSummaryResponse(conversations=conversations_summary_objects)
