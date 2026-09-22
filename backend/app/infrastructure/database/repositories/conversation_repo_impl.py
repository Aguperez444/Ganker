from typing import Optional

from app.application.ports.i_conversation_repository import IConversationRepository
from app.infrastructure.database.mappers.conversation_mapper import ConversationMapper
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.domain.models.conversation import Conversation


class ConversationRepositoryImpl(IConversationRepository):
    def __init__(self, session):
        self.session = session


    def create_conversation(self, new_conversation: 'Conversation') -> 'Conversation':
        new_conversation_orm = ConversationMapper.domain_to_orm(new_conversation)
        merged = self.session.merge(new_conversation_orm)
        self.session.flush()
        self.session.refresh(merged)
        return ConversationMapper.orm_to_domain(merged)

    def list_by_user_id(self, user_id: int) -> list['Conversation']:
        found_conversations: list[ConversationORM] = self.session.query(ConversationORM).filter(
            (ConversationORM.user_1_id == user_id) | (ConversationORM.user_2_id == user_id)
        ).all()


        return [ConversationMapper.orm_to_domain_last_message_only(conversation) if conversation.messages else ConversationMapper.orm_to_domain_no_messages(conversation) for conversation in found_conversations]



    def find_by_participants_ids(self, user_1_id: int, user_2_id: int) -> Optional['Conversation']:
        # Como normalizamos en el use case, alcanza con comparar exactamente las columnas
        found_conversation: ConversationORM = self.session.query(ConversationORM).filter(
            ConversationORM.user_1_id == user_1_id,
            ConversationORM.user_2_id == user_2_id
        ).first()

        if not found_conversation:
            return None
        return ConversationMapper.orm_to_domain_no_messages(found_conversation)



    def get_by_conversation_id(self, conversation_id: int) -> Optional['Conversation']:
        conversation = self.session.query(ConversationORM).filter(ConversationORM.conversation_id == conversation_id).first()
        if not conversation:
            return None
        return ConversationMapper.orm_to_domain_no_messages(conversation)

