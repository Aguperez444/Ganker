from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.infrastructure.database.models.message_orm import MessageORM
from app.domain.models.message import Message


class MessageMapper:
    @staticmethod
    def orm_to_domain(message_orm: MessageORM) -> Message:
        return Message(
            message_id=message_orm.message_id,
            conversation_id=message_orm.conversation_id,
            sender=UserMapper.orm_to_domain(message_orm.sender),
            content=message_orm.content,
            timestamp=message_orm.timestamp
        )

    @staticmethod
    def domain_to_orm(message: Message) -> MessageORM:
        return MessageORM(
            message_id=message.message_id,
            conversation_id=message.conversation_id,
            sender_id=message.sender.user_id,
            content=message.content,
            timestamp=message.timestamp
        )