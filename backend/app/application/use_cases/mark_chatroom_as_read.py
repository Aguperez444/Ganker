from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.chatroom_access import get_chatroom_for_member


class MarkChatroomAsRead:
    """
    En un chatroom grupal el estado de lectura es por miembro (no por mensaje como en las conversaciones privadas),
    por eso se guarda el último mensaje leído de cada miembro.
    """
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, chatroom_id: int, user_id: int) -> int:
        """Marca el chatroom como leído para el usuario y retorna la cantidad de mensajes que estaban sin leer."""
        with self._uow as uow:
            chatroom = get_chatroom_for_member(uow, chatroom_id, user_id)
            member = chatroom.get_member(user_id)
            last_read = member.last_read_message_id if member else None

            last_message_id = uow.message_repo.get_last_message_id(chatroom_id)
            if last_message_id is None or (last_read is not None and last_read >= last_message_id):
                return 0

            unread = uow.message_repo.get_unread_count_after(chatroom_id, user_id, last_read)
            uow.conversation_repo.update_last_read_message(chatroom_id, user_id, last_message_id)
            return unread
