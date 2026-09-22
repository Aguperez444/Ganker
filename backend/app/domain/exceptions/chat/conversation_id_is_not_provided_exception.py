from app.domain.exceptions.domain_exception import DomainException



class ConversationIdIsNotProvidedException(DomainException):
    def __init__(self):
        msg = f"No se proporciono el id de la conversación"
        super().__init__(message=msg,status_code=400)



