from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from models.character import Character

class ICharacterRepository(ABC):


    @abstractmethod
    def get_character_by_id(self, character_id: int) -> Optional['Character']:
        raise NotImplementedError