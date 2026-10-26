from app.domain.exceptions.domain_exception import DomainException


class InvalidRegistrationTokenException(DomainException):
    def __init__(self):
        super().__init__(
            message="El enlace de confirmación es inválido, venció o ya fue utilizado. Solicitá uno nuevo.",
            status_code=400,
        )
