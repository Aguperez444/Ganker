from app.application.ports.i_unit_of_work import IUnitOfWork


class CheckChatroomAccess:
    def __init__(self, uow: IUnitOfWork):
        self._uow: IUnitOfWork = uow

    def execute(self, chatroom_id: int, user_id: int) -> bool:
        """Indica si el chatroom existe, es de tipo grupal y el usuario es miembro."""
        with self._uow as uow:
            chatroom = uow.conversation_repo.get_by_conversation_id(chatroom_id)
            return bool(chatroom and chatroom.is_group() and chatroom.belongs_user_id(user_id))
