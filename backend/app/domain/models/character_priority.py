from typing import TYPE_CHECKING, Optional

from app.domain.exceptions.entity_not_persited_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.character import Character



class CharacterPriority:
    def __init__(self, priority_id: Optional[int], character: Character, priority: int):
        self._priority_id: Optional[int] = priority_id
        self._character: Character = character
        self._priority: int = priority

    @property
    def character(self) -> Character:
        return self._character
    @character.setter
    def character(self, value: Character) -> None:
        self._character = value

    @property
    def priority(self) -> int:
        return self._priority
    @priority.setter
    def priority(self, value: int) -> None:
        self._priority = value

    @property
    def priority_id(self) -> int:
        if self._priority_id is None:
            raise EntityNotPersistedException("CharacterPriority")
        return self._priority_id
    @priority_id.setter
    def priority_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._priority_id = value

    def is_persisted(self) -> bool:
        return self._priority_id is not None

    def __repr__(self) -> str:
        return f"CharacterPriority(priority_id={self.priority_id or 'sin_id'}, character={self.character}, priority={self.priority})"
