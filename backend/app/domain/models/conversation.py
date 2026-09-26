from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.user import User
    from app.domain.models.message import Message


class Conversation:
    def __init__(self, conversation_id: int|None, user_1: 'User', user_2: 'User', messages: list['Message']):
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

    def belongs_user_id(self, user_id: int):
        if user_id != self.user_1.user_id and user_id != self.user_2.user_id:
            return False
        return True

    def belongs_user(self, user: 'User'):
        if user.user_id != self.user_1.user_id and user.user_id != self.user_2.user_id:
            return False
        return True

    def get_other_user(self, user_id: int) -> 'User':
        if user_id == self.user_1.user_id:
            return self.user_2
        elif user_id == self.user_2.user_id:
            return self.user_1
        raise ValueError(f"User with id {user_id} is not part of this conversation.")