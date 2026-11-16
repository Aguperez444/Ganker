from app.domain.exceptions.domain_exception import DomainException


class BanAppealAlreadyExistsException(DomainException):
    def __init__(self):
        super().__init__(
            message="Ya presentaste una apelación para este baneo.",
            status_code=409,
        )
