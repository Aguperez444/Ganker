from app.domain.exceptions.domain_exception import DomainException


class InvalidUsernameException(DomainException):
    def __init__(self, username: str):
        super().__init__(
            message=f'El username: "{username}" es inválido o usa caracteres inválidos.',
            status_code=400
        )
