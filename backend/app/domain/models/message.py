
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.user import User
    from datetime import datetime


class Message:
    def __init__(self, message_id: int|None, content: str, sender: 'User', conversation_id: int, timestamp: 'datetime'):
        self._message_id: int|None = message_id
        self._content: str = content
        self._sender: 'User' = sender
        self._conversation_id: int = conversation_id
        self._timestamp: 'datetime' = timestamp

    @property
    def message_id(self) -> int|None:
        return self._message_id
    @message_id.setter
    def message_id(self, value: int|None):
        self._message_id = value

    @property
    def content(self) -> str:
        return self._content
    @content.setter
    def content(self, value: str):
        self._content = value

    @property
    def sender(self) -> 'User':
        return self._sender
    @sender.setter
    def sender(self, value: 'User'):
        self._sender = value

    @property
    def conversation_id(self) -> int:
        return self._conversation_id
    @conversation_id.setter
    def conversation_id(self, value: int):
        self._conversation_id = value

    @property
    def timestamp(self) -> 'datetime':
        return self._timestamp
    @timestamp.setter
    def timestamp(self, value: 'datetime'):
        self._timestamp = value