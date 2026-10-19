from app.domain.exceptions.domain_exception import DomainException


class NotValidReasonException(DomainException):
    def __init__(self):
        super().__init__(message="Razón inválida para reportar a un jugador.", status_code=400)