from app.application.ports.i_message_repository import IMessageRepository
from app.domain.models.message import Message
from app.infrastructure.database.mappers.message_mapper import MessageMapper
from app.infrastructure.database.models import MessageORM


class MessageRepoImpl(IMessageRepository):
    def __init__(self, session):
        self._session = session

    def save_message(self, message: Message) -> Message:
        orm_message = MessageMapper.domain_to_orm(message)
        self._session.add(orm_message)
        self._session.flush()
        self._session.refresh(orm_message)
        return MessageMapper.orm_to_domain(orm_message)

    def get_by_conversation_id(self, conversation_id: int, skip: int, limit: int) -> list[Message]:
        #obtiene los mensajes paginados ordenados por fecha de creación descendente y por id descendente
        orm_messages = (self._session.query(MessageORM).filter_by(conversation_id=conversation_id).order_by(MessageORM.timestamp.desc(), MessageORM.message_id.desc()).offset(skip).limit(limit).all())
        return [MessageMapper.orm_to_domain(orm_message) for orm_message in orm_messages]

    def get_unread_count_by_conversation_id(self, conversation_id: int, user_id: int) -> int:
        unread_count = self._session.query(MessageORM).filter(
            MessageORM.conversation_id == conversation_id,
            MessageORM.sender_id != user_id,
            MessageORM.is_read == False
        ).count()

        return unread_count

    def mark_as_read(self, conversation_id: int, reader_user_id: int):
        # Marca como leídos los mensajes de una conversación para un usuario específico
        updated_rows = self._session.query(MessageORM).filter(
            MessageORM.conversation_id == conversation_id,
            MessageORM.sender_id != reader_user_id,
            MessageORM.is_read == False
        ).update({MessageORM.is_read: True}, synchronize_session='fetch')
        self._session.flush()
        return updated_rows