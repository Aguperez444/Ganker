from typing import Optional, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.user import User

class ChatroomMember:
    def __init__(self, chatroom_member_id: Optional[int], chatroom_id: int, user: 'User'):
        self._chatroom_member_id = chatroom_member_id
        self._chatroom_id = chatroom_id
        self._user = user

    @property
    def chatroom_member_id(self) -> int:
        if self._chatroom_member_id is None:
            raise EntityNotPersistedException("ChatroomMember")
        return self._chatroom_member_id
    @chatroom_member_id.setter
    def chatroom_member_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._chatroom_member_id = value

    @property
    def chatroom_id(self) -> int:
        return self._chatroom_id
    @chatroom_id.setter
    def chatroom_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._chatroom_id = value

    @property
    def user(self) -> 'User':
        return self._user
    @user.setter
    def user(self, value: 'User'):
        self._user = value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, ChatroomMember):
            return self._chatroom_member_id is not None and self._chatroom_member_id == other._chatroom_member_id
        return False

    def is_persisted(self) -> bool:
        return self._chatroom_member_id is not None

    def __repr__(self) -> str:
        return f"ChatroomMember(chatroom_member_id={self.chatroom_member_id if self.is_persisted() else 'sin_id'}, chatroom_id={self.chatroom_id}, user={self.user})"
