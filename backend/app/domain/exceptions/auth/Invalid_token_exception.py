from app.domain.exceptions.domain_exception import DomainException


class InvalidTokenException(DomainException):
    def __init__(self, message: str = "Token inválido."):
        super().__init__(
            message=message,
            status_code=401
        )
