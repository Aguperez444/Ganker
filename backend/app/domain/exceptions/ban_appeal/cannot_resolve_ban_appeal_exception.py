from app.domain.exceptions.domain_exception import DomainException


class CannotResolveBanAppealException(DomainException):
    def __init__(self):
        super().__init__(
            message="No tenés permisos para resolver esta apelación.",
            status_code=403,
        )
