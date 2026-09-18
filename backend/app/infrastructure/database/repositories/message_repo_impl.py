from app.application.ports.i_message_repository import IMessageRepository
from app.domain.models.message import Message
from app.infrastructure.database.mappers.message_mapper import MessageMapper

class MessageRepoImpl(IMessageRepository):
    def __init__(self, session):
        self._session = session

    def save_message(self, message: Message) -> Message:
        orm_message = MessageMapper.domain_to_orm(message)
        self._session.add(orm_message)
        merged_orm = self._session.merge(orm_message)
        self._session.flush()
        self._session.refresh(merged_orm)
        return MessageMapper.orm_to_domain(merged_orm)