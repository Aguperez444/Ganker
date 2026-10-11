from app.domain.models.conversation import Conversation
from app.infrastructure.database.mappers.message_mapper import MessageMapper
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.mappers.conversation_member_mapper import ConversationMemberMapper
from app.domain.models.conversation_type_enum import ConversationTypeEnum

class ConversationMapper:
    @staticmethod
    def orm_to_domain(conversation_orm: ConversationORM) -> Conversation:
        return Conversation(
            conversation_id=conversation_orm.conversation_id,
            members=[ConversationMemberMapper.orm_to_domain(member) for member in conversation_orm.members],
            messages=[MessageMapper.orm_to_domain(message) for message in conversation_orm.messages],
            conversation_type=ConversationTypeEnum(conversation_orm.type) if conversation_orm.type else ConversationTypeEnum.PRIVATE,
            name=conversation_orm.name
        )
    @staticmethod
    def domain_to_orm(conversation: Conversation) -> ConversationORM:
        if not conversation.is_persisted():
            return ConversationORM(
                type=conversation.conversation_type.value if conversation.conversation_type else 1,
                name=conversation.name,
                members=[ConversationMemberMapper.domain_to_orm(member) for member in conversation.members],
                messages=[MessageMapper.domain_to_orm(message) for message in conversation.messages]
            )
        return ConversationORM(
            conversation_id=conversation.conversation_id,
            type=conversation.conversation_type.value if conversation.conversation_type else 1,
            name=conversation.name,
            members=[ConversationMemberMapper.domain_to_orm(member) for member in conversation.members],
            messages=[MessageMapper.domain_to_orm(message) for message in conversation.messages]
        )

    @staticmethod
    def orm_to_domain_no_messages(conversation_orm: ConversationORM) -> Conversation:
        return Conversation(
            conversation_id=conversation_orm.conversation_id,
            members=[ConversationMemberMapper.orm_to_domain(member) for member in conversation_orm.members],
            messages=[],
            conversation_type=ConversationTypeEnum(conversation_orm.type) if conversation_orm.type else ConversationTypeEnum.PRIVATE,
            name=conversation_orm.name
        )

    @staticmethod
    def orm_to_domain_last_message_only(conversation_orm: ConversationORM) -> Conversation:
        return Conversation(
            conversation_id=conversation_orm.conversation_id,
            members=[ConversationMemberMapper.orm_to_domain(member) for member in conversation_orm.members],
            messages=[MessageMapper.orm_to_domain(conversation_orm.messages[-1])] if conversation_orm.messages else [],
            conversation_type=ConversationTypeEnum(conversation_orm.type) if conversation_orm.type else ConversationTypeEnum.PRIVATE,
            name=conversation_orm.name
        )
