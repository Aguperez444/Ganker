from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork


class CheckConversationAccess:
    def __init__(self, uow: IUnitOfWork):
        self._uow: IUnitOfWork = uow

    def execute(self, conversation_id: int, user_id: int) -> tuple[bool, Optional[int]]:
        with self._uow as uow:
            conversation = uow.conversation_repo.get_by_conversation_id(conversation_id)
            if not conversation or not conversation.belongs_user_id(user_id):
                return False, None
            other_user = conversation.get_other_user(user_id)
            return True, other_user.user_id

