from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.chat.conversation_not_found_exception import ConversationNotFoundException
from app.domain.exceptions.chat.user_does_not_belong_to_conversation_exception import UserDoesNotBelongToConversationException


class MarkAsRead:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, conversation_id: int, user_id: int) -> int:
        with self._uow as uow:

            conversation = uow.conversation_repo.get_by_conversation_id(conversation_id)
            if not conversation:
                raise ConversationNotFoundException(conversation_id)

            if not conversation.belongs_user_id(user_id):
                raise UserDoesNotBelongToConversationException(conversation_id, user_id)

            # Marcamos como leídos solo los mensajes que envió el OTRO jugador
            # (no tiene sentido marcar como leídos los que mandó uno mismo)
            updated_rows = uow.message_repo.mark_as_read(
                conversation_id=conversation_id,
                reader_user_id=user_id
            )
            return updated_rows