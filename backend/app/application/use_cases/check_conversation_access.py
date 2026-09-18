from app.application.ports.i_unit_of_work import IUnitOfWork


class CheckConversationAccessUseCase:
    def __init__(self, uow: IUnitOfWork):
        self._uow: IUnitOfWork = uow

    def execute(self, conversation_id: int, user_id: int) -> bool:
        with self._uow as uow:
            return uow.conversation_repo.is_participant(conversation_id, user_id)

