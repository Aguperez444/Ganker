from app.domain.exceptions.domain_exception import DomainException



class SenderIdIsNotProvidedException(DomainException):
    def __init__(self):
        msg = f"No se proporciono el id del remitente del mensaje"
        super().__init__(message=msg,status_code=400)
