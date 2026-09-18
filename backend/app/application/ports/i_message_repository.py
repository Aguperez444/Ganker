from abc import ABC, abstractmethod

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.message import Message


class IMessageRepository(ABC):
    @abstractmethod
    def save_message(self, message: Message) -> Message:
        """Inserta el mensaje en la tabla message y lo retorna persistido."""
        pass