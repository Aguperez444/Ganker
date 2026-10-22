from app.domain.exceptions.domain_exception import DomainException


class AuthenticationTokenNotProvidedException(DomainException):
    def __init__(self):
        super().__init__(
            message="Token de autenticación no proporcionado",
            status_code=401
        )
