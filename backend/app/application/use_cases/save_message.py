from datetime import datetime
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.message_response import MessageResponse

from typing import cast

from app.domain.models.message import Message
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.chat.message_is_empty_exception import MessageIsEmptyException
from app.domain.exceptions.chat.conversation_id_is_not_provided_exception import ConversationIdIsNotProvidedException
from app.domain.exceptions.chat.sender_id_is_not_provided_exception import SenderIdIsNotProvidedException


class SaveMessage:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, conversation_id: int, sender_id: int, content: str, is_read: bool = False) -> MessageResponse:
        clean_content = content.strip()
        if not clean_content:
            raise MessageIsEmptyException()
        if not conversation_id:
            raise ConversationIdIsNotProvidedException()
        if not sender_id:
            raise SenderIdIsNotProvidedException()

        with self._uow as uow:
            # busco al usuario que envió el mensaje
            sender = uow.user_repo.get_user_by_id(sender_id)
            if not sender:
                raise UserNotFoundException(sender_id)

            # no se válida la seguridad en cada mensaje, el websocket se encarga de validar la seguridad durante la conexión inicial

            new_message = Message(None, content, sender, conversation_id, datetime.now(), is_read)
            message = uow.message_repo.save_message(new_message)

            return MessageResponse(message_id=cast(int, message.message_id), conversation_id=message.conversation_id,
                                   sender_id=cast(int, message.sender.user_id), content=message.content,
                                   timestamp=message.timestamp, is_read=message.is_read)