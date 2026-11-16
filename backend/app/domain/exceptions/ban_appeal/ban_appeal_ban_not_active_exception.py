from app.domain.exceptions.domain_exception import DomainException


class BanAppealBanNotActiveException(DomainException):
    def __init__(self):
        super().__init__(
            message="La apelación corresponde a un baneo que ya no está vigente.",
            status_code=409,
        )
