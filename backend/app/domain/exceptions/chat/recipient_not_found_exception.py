
from app.domain.exceptions.domain_exception import DomainException



class RecipientNotFoundException(DomainException):
    def __init__(self, conversation_id: int):
        msg = f"No se pudo encontrar el destinatario de la conversación con ID {conversation_id}."
        super().__init__(message=msg,status_code=404)



