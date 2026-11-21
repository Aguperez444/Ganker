from app.domain.exceptions.domain_exception import DomainException


class InvalidBanAppealTextException(DomainException):
    def __init__(self):
        super().__init__(
            message="La apelación debe tener entre 1 y 3000 caracteres.",
            status_code=422,
        )
