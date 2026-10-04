from typing import TYPE_CHECKING, Optional, List

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException
from app.domain.models.conversation_type_enum import ConversationTypeEnum

if TYPE_CHECKING:
    from app.domain.models.user import User
    from app.domain.models.message import Message
    from app.domain.models.conversation_member import ConversationMember


class Conversation:
    def __init__(self, conversation_id: Optional[int], members: List['ConversationMember'], messages: list['Message'], conversation_type: ConversationTypeEnum = ConversationTypeEnum.PRIVATE, name: Optional[str] = None):
        self._conversation_id: Optional[int] = conversation_id
        self._members: List['ConversationMember'] = members
        self._messages: list['Message'] = messages
        self._conversation_type: ConversationTypeEnum = conversation_type
        self._name: Optional[str] = name


    @property
    def conversation_id(self) -> int:
        if self._conversation_id is None:
            raise EntityNotPersistedException("Conversation")
        return self._conversation_id

    @conversation_id.setter
    def conversation_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._conversation_id = value

    @property
    def members(self) -> List['ConversationMember']:
        return self._members
    
    @members.setter
    def members(self, value: List['ConversationMember']):
        self._members = value

    @property
    def messages(self) -> list['Message']:
        return self._messages
    
    @messages.setter
    def messages(self, value: list['Message']):
        self._messages = value

    @property
    def conversation_type(self) -> ConversationTypeEnum:
        return self._conversation_type
    
    @conversation_type.setter
    def conversation_type(self, value: ConversationTypeEnum):
        self._conversation_type = value

    @property
    def name(self) -> Optional[str]:
        return self._name

    @name.setter
    def name(self, value: Optional[str]):
        self._name = value


    def is_persisted(self) -> bool:
        return self._conversation_id is not None

    def belongs_user_id(self, user_id: int):
        return any(member.user.user_id == user_id for member in self._members)

    def get_other_user(self, user_id: int) -> 'User':
        if self._conversation_type == ConversationTypeEnum.PRIVATE:
            for member in self._members:
                if member.user.user_id != user_id:
                    return member.user
        raise ValueError(f"El usuario con id {user_id} no tiene un único 'otro' usuario en esta conversación.")
