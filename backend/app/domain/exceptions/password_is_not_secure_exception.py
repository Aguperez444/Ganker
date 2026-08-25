from app.domain.exceptions.domain_exception import DomainException


class PasswordIsNotSecureException(DomainException):
    def __init__(self, msg_reason: str):
        super().__init__(
            message=f'La contraseña no es lo suficientemente segura porque: {msg_reason}.',
            status_code=400
        )
