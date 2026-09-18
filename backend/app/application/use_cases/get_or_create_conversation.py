from typing import TYPE_CHECKING

from app.domain.models.conversation import Conversation
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException

if TYPE_CHECKING:
    from app.application.ports.i_unit_of_work import IUnitOfWork


class GetOrCreateConversationUseCase:
    def __init__(self, uow: 'IUnitOfWork'):
        self.uow = uow

    def execute(self, current_user_id: int, target_user_id: int) -> Conversation:
        if current_user_id == target_user_id:
            raise ValueError("No podés iniciar una conversación con vos mismo")

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
            new_conversation = Conversation(
                conversation_id=None,
                user_1=user_1,
                user_2=user_2,
                messages=[]  # Inicializo la lista de mensajes vacía
            )


            return uow.conversation_repo.create_conversation(new_conversation)