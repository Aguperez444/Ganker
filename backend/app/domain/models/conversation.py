from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.user import User
    from app.domain.models.message import Message


class Conversation:
    def __init__(self, conversation_id: int|None, user_1: User, user_2: User, messages: list['Message']):
        self._conversation_id: int|None = conversation_id
        self._user_1: 'User' = user_1
        self._user_2: 'User' = user_2
        self._messages: list['Message'] = messages


    @property
    def conversation_id(self) -> int|None:
        return self._conversation_id
    @conversation_id.setter
    def conversation_id(self, value: int):
        self._conversation_id = value

    @property
    def user_1(self) -> 'User':
        return self._user_1
    @user_1.setter
    def user_1(self, value: 'User'):
        self._user_1 = value

    @property
    def user_2(self) -> 'User':
        return self._user_2
    @user_2.setter
    def user_2(self, value: 'User'):
        self._user_2 = value

    @property
    def messages(self) -> list:
        return self._messages
    @messages.setter
    def messages(self, value: list):
        self._messages = value