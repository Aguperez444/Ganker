from typing import Optional

from app.application.ports.i_conversation_repository import IConversationRepository
from app.infrastructure.database.mappers.conversation_mapper import ConversationMapper
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
from app.infrastructure.database.models.user_orm import UserORM
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

    def list_by_user_id(self, user_id: int, conversation_type=None) -> list["Conversation"]:
        query = (
            self.session.query(ConversationORM)
            .join(ConversationMemberORM, ConversationMemberORM.conversation_id == ConversationORM.conversation_id)
            .join(UserORM, UserORM.user_id == ConversationMemberORM.user_id)
            .filter(
                ConversationMemberORM.user_id == user_id,
                UserORM.deleted == False,
                UserORM.banned == False,
            )
        )
        if conversation_type is not None:
            query = query.filter(ConversationORM.type == int(conversation_type))
        conversations = query.distinct().all()

        valid_conversations = []
        for c in conversations:
            if c.type == 1:
                # En conversaciones privadas, si alguno de los participantes está eliminado o baneado, no se lista
                if any(
                    m.user is None
                    or getattr(m.user, "deleted", False) is True
                    or getattr(m.user, "banned", False) is True
                    for m in c.members
                ):
                    continue
            valid_conversations.append(
                ConversationMapper.orm_to_domain_last_message_only(c)
                if c.messages
                else ConversationMapper.orm_to_domain_no_messages(c)
            )
        return valid_conversations


    def find_by_participants_ids(self, user_1_id: int, user_2_id: int) -> Optional["Conversation"]:
        conversation = (
            self.session.query(ConversationORM)
            .join(ConversationMemberORM, ConversationMemberORM.conversation_id == ConversationORM.conversation_id)
            .join(UserORM, UserORM.user_id == ConversationMemberORM.user_id)
            .filter(
                ConversationORM.type == 1,
                ConversationMemberORM.user_id.in_([user_1_id, user_2_id]),
                UserORM.deleted == False,
                UserORM.banned == False,
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

    def update_last_read_message(self, conversation_id: int, user_id: int, message_id: int) -> None:
        self.session.query(ConversationMemberORM).filter(
            ConversationMemberORM.conversation_id == conversation_id,
            ConversationMemberORM.user_id == user_id
        ).update({ConversationMemberORM.last_read_message_id: message_id}, synchronize_session='fetch')
        self.session.flush()
