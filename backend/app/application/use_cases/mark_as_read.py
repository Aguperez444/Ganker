from app.application.ports.i_unit_of_work import IUnitOfWork


class MarkAsRead:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, conversation_id: int, user_id: int) -> int:
        with self._uow as uow:
            # Marcamos como leídos solo los mensajes que envió el OTRO jugador
            # (no tiene sentido marcar como leídos los que mandó uno mismo)
            updated_rows = uow.message_repo.mark_as_read(
                conversation_id=conversation_id,
                reader_user_id=user_id
            )
            return updated_rows