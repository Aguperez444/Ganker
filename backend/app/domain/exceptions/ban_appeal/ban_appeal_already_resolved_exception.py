from app.domain.exceptions.domain_exception import DomainException


class BanAppealAlreadyResolvedException(DomainException):
    def __init__(self):
        super().__init__(
            message="La apelación ya fue resuelta.",
            status_code=409,
        )
