from abc import ABC, abstractmethod

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.conversation import Conversation
    from app.domain.models.conversation_type_enum import ConversationTypeEnum


class IConversationRepository(ABC):
    @abstractmethod
    def get_by_conversation_id(self, conversation_id: int) -> Optional['Conversation']:
        """Verifica si el usuario es uno de los dos que pertenece a la conversación."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def find_by_participants_ids(self, user_1_id: int, user_2_id: int) -> Optional['Conversation']:
        """Busca una conversación existente entre dos usuarios dados sus ID."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def create_conversation(self, new_conversation: 'Conversation') -> 'Conversation':
        """guarda una nueva conversación en bdd y la devuelve."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def list_by_user_id(self, user_id: int, conversation_type: Optional['ConversationTypeEnum'] = None) -> list[Conversation]:
        """Lista las conversaciones de un usuario, opcionalmente filtradas por tipo."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")

    @abstractmethod
    def update_last_read_message(self, conversation_id: int, user_id: int, message_id: int) -> None:
        """Actualiza el último mensaje leído de un miembro de la conversación."""
        raise NotImplementedError("Este método debe ser implementado por la clase hija.")
