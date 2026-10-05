from typing import Optional

from app.application.ports.i_conversation_repository import IConversationRepository
from app.infrastructure.database.mappers.conversation_mapper import ConversationMapper
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
from app.domain.models.conversation import Conversation
from sqlalchemy import func, distinct

class ConversationRepositoryImpl(IConversationRepository):
    def __init__(self, session):
        self.session = session


    def create_conversation(self, new_conversation: 'Conversation') -> 'Conversation':
        new_conversation_orm = ConversationMapper.domain_to_orm(new_conversation)
        merged = self.session.merge(new_conversation_orm)
        self.session.flush()
        self.session.refresh(merged)
        return ConversationMapper.orm_to_domain(merged)

    def list_by_user_id(self, user_id: int) -> list["Conversation"]:
        conversations = (
            self.session.query(ConversationORM)
            .join(ConversationMemberORM)
            .filter(ConversationMemberORM.user_id == user_id)
            .distinct()
            .all()
        )

        return [
            ConversationMapper.orm_to_domain_last_message_only(c)
            if c.messages
            else ConversationMapper.orm_to_domain_no_messages(c)
            for c in conversations
        ]


    def find_by_participants_ids(self, user_1_id: int, user_2_id: int) -> Optional["Conversation"]:
        conversation = (
            self.session.query(ConversationORM)
            .join(ConversationMemberORM)
            .filter(
                ConversationORM.type == 1,
                ConversationMemberORM.user_id.in_([user_1_id, user_2_id])
            )
            .group_by(ConversationORM.conversation_id)
            .having(func.count(distinct(ConversationMemberORM.user_id)) == 2)
            .first()
        )

        if conversation is None:
            return None

        return ConversationMapper.orm_to_domain_no_messages(conversation)

    def get_by_conversation_id(self, conversation_id: int) -> Optional['Conversation']:
        conversation = self.session.query(ConversationORM).filter(ConversationORM.conversation_id == conversation_id).first()
        if not conversation:
            return None
        return ConversationMapper.orm_to_domain_no_messages(conversation)
