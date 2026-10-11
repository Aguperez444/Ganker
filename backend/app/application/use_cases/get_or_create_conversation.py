from typing import TYPE_CHECKING

from app.domain.models.conversation import Conversation
from app.domain.models.conversation_member import ConversationMember
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.chat.cannot_start_conversation_with_self_exception import CannotStartConversationWithSelfException

if TYPE_CHECKING:
    from app.application.ports.i_unit_of_work import IUnitOfWork


class GetOrCreateConversation:
    def __init__(self, uow: 'IUnitOfWork'):
        self.uow = uow

    def execute(self, current_user_id: int, target_user_id: int) -> Conversation:
        if current_user_id == target_user_id:
            raise CannotStartConversationWithSelfException()

        # Normalizamos el orden para garantizar unicidad estricta
        user_1_id = min(current_user_id, target_user_id)
        user_2_id = max(current_user_id, target_user_id)

        with self.uow as uow:
            # 1. buscamos los usuarios y validamos que existan
            user_1 = uow.user_repo.get_user_by_id(user_1_id)
            user_2 = uow.user_repo.get_user_by_id(user_2_id)
            if not user_1:
                raise UserNotFoundException(user_1_id)
            if not user_2:
                raise UserNotFoundException(user_2_id)

            # 2. Buscamos si ya existe la conversación entre estos dos usuarios
            existing = uow.conversation_repo.find_by_participants_ids(user_1_id, user_2_id)
            if existing:
                return existing

            # 3. Si no existe, creamos el nuevo agregado
            member_1 = ConversationMember(conversation_member_id=None, conversation_id=None, user=user_1, role=None)
            member_2 = ConversationMember(conversation_member_id=None, conversation_id=None, user=user_2, role=None)
            
            new_conversation = Conversation(
                conversation_id=None,
                members=[member_1, member_2],
                messages=[],
                conversation_type=ConversationTypeEnum.PRIVATE,
                name=None
            )

            return uow.conversation_repo.create_conversation(new_conversation)
