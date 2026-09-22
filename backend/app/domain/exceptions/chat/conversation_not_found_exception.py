from typing import Optional
from app.domain.exceptions.domain_exception import DomainException



class ConversationNotFoundException(DomainException):
    def __init__(self, conversation_id: Optional[int] = None):
        msg = f"No se encontró la conversación con ID {conversation_id}"
        super().__init__(message=msg,status_code=404)
