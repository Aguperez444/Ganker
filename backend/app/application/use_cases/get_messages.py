from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.chat.conversation_not_found_exception import ConversationNotFoundException
from app.infrastructure.api.dto.response.base_classes.message_object_response import MessageObjectResponse

from typing import cast

from app.infrastructure.api.dto.response.get_messages_response import GetMessagesResponse
from app.domain.exceptions.chat.user_does_not_belong_to_conversation_exception import UserDoesNotBelongToConversationException


class GetMessages:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, conversation_id: int, user_id: int, page: int, size: int) -> GetMessagesResponse:
        with self.uow as uow:
            # obtener la conversación por su ID
            conversation = uow.conversation_repo.get_by_conversation_id(conversation_id)

            # verificar que exista
            if not conversation:
                raise ConversationNotFoundException(conversation_id)

            # verificar que el usuario sea parte de la conversación
            if not conversation.belongs_user_id(user_id):
                raise UserDoesNotBelongToConversationException(conversation_id, user_id)

            # asegurarse de estar levantando un minimo de mensajes
            limit = size if size > 0 else 30
            skip = (page-1)  * limit if page >= 1 else 0


            # obtener los mensajes de la conversación
            messages = uow.message_repo.get_by_conversation_id(conversation_id, skip, limit)

            # mapear los mensajes a la respuesta
            messages_list = [MessageObjectResponse(
                message_id=cast(int, message.message_id),
                conversation_id=message.conversation_id,
                sender_id=cast(int, message.sender.user_id),
                content=message.content,
                timestamp=message.timestamp,
                is_read=message.is_read
            ) for message in messages]

            return GetMessagesResponse(messages=messages_list)