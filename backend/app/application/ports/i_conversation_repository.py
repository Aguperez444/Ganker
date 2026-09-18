from abc import ABC, abstractmethod

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.conversation import Conversation


class IConversationRepository(ABC):
    @abstractmethod
    def is_participant(self, conversation_id: int, user_id: int) -> bool:
        """Verifica si el usuario es uno de los dos que pertenece a la conversación."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def find_by_participants_ids(self, user_1_id: int, user_2_id: int) -> Optional['Conversation']:
        """Busca una conversación existente entre dos usuarios dados sus IDs."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def create_conversation(self, new_conversation: 'Conversation') -> 'Conversation':
        """guarda una nueva conversación en bdd y la devuelve."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def list_by_user_id(self, user_id: int) -> list[Conversation]:
        """Lista todas las conversaciones de un usuario."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")