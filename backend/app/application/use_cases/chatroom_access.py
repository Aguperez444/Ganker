from typing import TYPE_CHECKING

from app.domain.exceptions.chat.conversation_not_found_exception import ConversationNotFoundException
from app.domain.exceptions.chat.user_does_not_belong_to_conversation_exception import \
    UserDoesNotBelongToConversationException

if TYPE_CHECKING:
    from app.application.ports.i_unit_of_work import IUnitOfWork
    from app.domain.models.conversation import Conversation


def get_chatroom_for_member(uow: 'IUnitOfWork', chatroom_id: int, user_id: int) -> 'Conversation':
    """
    Obtiene un chatroom (conversación de tipo GROUP) verificando que exista y que el usuario sea miembro.
    Una conversación privada no se considera un chatroom, por lo que se responde como no encontrada.
    """
    chatroom = uow.conversation_repo.get_by_conversation_id(chatroom_id)
    if not chatroom or not chatroom.is_group():
        raise ConversationNotFoundException(chatroom_id)
    if not chatroom.belongs_user_id(user_id):
        raise UserDoesNotBelongToConversationException(chatroom_id, user_id)
    return chatroom
