from typing import Optional, TYPE_CHECKING
from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.user import User
    from app.domain.models.conversation_member_role_enum import ConversationMemberRoleEnum

class ConversationMember:
    def __init__(self, conversation_member_id: Optional[int], conversation_id: Optional[int], user: 'User',
                 role: Optional['ConversationMemberRoleEnum'] = None, last_read_message_id: Optional[int] = None):
        self._conversation_member_id: int|None = conversation_member_id
        self._conversation_id: Optional[int] = conversation_id
        self._user: 'User' = user
        self._role: ConversationMemberRoleEnum | None = role
        self._last_read_message_id: Optional[int] = last_read_message_id

    @property
    def conversation_member_id(self) -> int:
        if self._conversation_member_id is None:
            raise EntityNotPersistedException("ConversationMember")
        return self._conversation_member_id

    @conversation_member_id.setter
    def conversation_member_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._conversation_member_id = value

    @property
    def conversation_id(self) -> int:
        if self._conversation_id is None:
            raise EntityNotPersistedException("ConversationMember")
        return self._conversation_id

    @conversation_id.setter
    def conversation_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._conversation_id = value

    @property
    def user(self) -> 'User':
        return self._user

    @user.setter
    def user(self, value: 'User'):
        self._user = value

    @property
    def role(self) -> Optional['ConversationMemberRoleEnum']:
        return self._role

    @role.setter
    def role(self, value: Optional['ConversationMemberRoleEnum']):
        self._role = value

    @property
    def last_read_message_id(self) -> Optional[int]:
        """ID del último mensaje leído por el miembro (usado para el conteo de no leídos en chatrooms grupales)."""
        return self._last_read_message_id

    @last_read_message_id.setter
    def last_read_message_id(self, value: Optional[int]):
        self._last_read_message_id = value

    def is_persisted(self) -> bool:
        return self._conversation_member_id is not None
