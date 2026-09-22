from datetime import datetime
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.message_response import MessageResponse

from typing import cast

from app.domain.models.message import Message
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException


class SaveMessageUseCase:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, conversation_id: int, sender_id: int, content: str, is_read: bool = False) -> MessageResponse:
        clean_content = content.strip()
        if not clean_content:
            raise ValueError("El mensaje no puede estar vacío") #TODO CREAR EXCEPCIONES CUSTOM
        if not conversation_id or not sender_id:
            raise ValueError("El ID de la conversación y el ID del remitente son obligatorios") #TODO CREAR EXCEPCIONES CUSTOM

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