from app.domain.exceptions.domain_exception import DomainException


class InvalidEmailChangeTokenException(DomainException):
    def __init__(self):
        super().__init__(
            message="El enlace para cambiar el email es inválido, venció o ya fue utilizado. Solicitá uno nuevo desde Mi cuenta.",
            status_code=400,
        )
