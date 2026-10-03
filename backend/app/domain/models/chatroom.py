from typing import Optional, List, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.chatroom_member import ChatroomMember

class Chatroom:
    def __init__(self, chatroom_id: Optional[int], name: str, members: List['ChatroomMember'] = None):
        self._chatroom_id = chatroom_id
        self._name = name
        self._members = members if members is not None else []

    @property
    def chatroom_id(self) -> int:
        if self._chatroom_id is None:
            raise EntityNotPersistedException("Chatroom")
        return self._chatroom_id
    @chatroom_id.setter
    def chatroom_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._chatroom_id = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def members(self) -> List['ChatroomMember']:
        return self._members
    @members.setter
    def members(self, value: List['ChatroomMember']):
        self._members = value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Chatroom):
            return self._chatroom_id is not None and self._chatroom_id == other._chatroom_id
        return False

    def is_persisted(self) -> bool:
        return self._chatroom_id is not None

    def __repr__(self) -> str:
        return f"Chatroom(chatroom_id={self.chatroom_id if self.is_persisted() else 'sin_id'}, name='{self.name}')"
