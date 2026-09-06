from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.character import Character



class CharacterPriority:
    def __init__(self, priority_id: int, character: Character, priority: int):
        self._priority_id: int|None = priority_id
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
    def priority_id(self) -> int|None:
        return self._priority_id
    @priority_id.setter
    def priority_id(self, value: int|None) -> None:
        self._priority_id = value



