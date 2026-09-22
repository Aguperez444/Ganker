from abc import ABC, abstractmethod

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.message import Message


class IMessageRepository(ABC):
    @abstractmethod
    def save_message(self, message: Message) -> Message:
        """Inserta el mensaje en la tabla message y lo retorna persistido."""
        pass
    @abstractmethod
    def get_by_conversation_id(self, conversation_id: int, skip: int, limit: int) -> list[Message]:
        """Obtiene los mensajes de una conversación paginados."""
        pass

    @abstractmethod
    def get_unread_count_by_conversation_id(self, conversation_id, user_id: int) -> int:
        """Obtiene la cantidad de mensajes no leídos de una conversación."""
        pass

    @abstractmethod
    def mark_as_read(self, conversation_id, reader_user_id):
        """Marca como leídos los mensajes de una conversación para un usuario específico."""
        pass