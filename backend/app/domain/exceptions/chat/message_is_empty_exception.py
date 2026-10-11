from app.domain.exceptions.domain_exception import DomainException

class MessageIsEmptyException(DomainException, ValueError):
    def __init__(self):
        msg = "El mensaje enviado no puede estar vacío"
        super().__init__(message=msg, status_code=400)

