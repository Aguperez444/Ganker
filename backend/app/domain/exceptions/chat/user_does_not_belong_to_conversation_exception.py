from app.domain.exceptions.domain_exception import DomainException



class UserDoesNotBelongToConversationException(DomainException):
    def __init__(self, conversation_id: int, user_id: int):
        msg = f"El usuario con ID {user_id} no pertenece a la conversación con ID {conversation_id}"
        super().__init__(message=msg,status_code=403)
