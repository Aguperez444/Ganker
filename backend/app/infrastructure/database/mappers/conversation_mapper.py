from app.domain.models.conversation import Conversation
from app.infrastructure.database.mappers.message_mapper import MessageMapper
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.mappers.user_mapper import UserMapper

class ConversationMapper:
    @staticmethod
    def orm_to_domain(conversation_orm: ConversationORM) -> Conversation:
        return Conversation(
            conversation_id=conversation_orm.conversation_id,
            user_1=UserMapper.orm_to_domain(conversation_orm.user_1),
            user_2=UserMapper.orm_to_domain(conversation_orm.user_2),
            messages=[MessageMapper.orm_to_domain(message) for message in conversation_orm.messages]
        )
    @staticmethod
    def domain_to_orm(conversation: Conversation) -> ConversationORM:
        return ConversationORM(
            conversation_id=conversation.conversation_id,
            user_1_id=conversation.user_1.user_id,
            user_2_id=conversation.user_2.user_id,
            user_1=UserMapper.domain_to_orm(conversation.user_1),
            user_2=UserMapper.domain_to_orm(conversation.user_2),
            messages=[MessageMapper.domain_to_orm(message) for message in conversation.messages]
        )