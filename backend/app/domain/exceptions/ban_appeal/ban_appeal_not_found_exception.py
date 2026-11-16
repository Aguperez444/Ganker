from app.domain.exceptions.domain_exception import DomainException


class BanAppealNotFoundException(DomainException):
    def __init__(self):
        super().__init__(
            message="La apelación no existe.",
            status_code=404,
        )
