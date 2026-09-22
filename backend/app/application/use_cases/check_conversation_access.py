from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork


class CheckConversationAccessUseCase:
    def __init__(self, uow: IUnitOfWork):
        self._uow: IUnitOfWork = uow

    def execute(self, conversation_id: int, user_id: int) -> tuple[bool, Optional[int]]:
        with self._uow as uow:
            conversation = uow.conversation_repo.get_by_conversation_id(conversation_id)
            if not conversation:
                return False, None
            recipient_id = conversation.user_2.user_id if user_id == conversation.user_1.user_id else conversation.user_1.user_id
            return user_id == conversation.user_1.user_id or user_id == conversation.user_2.user_id, recipient_id

