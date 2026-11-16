from app.domain.exceptions.domain_exception import DomainException


class BanNotFoundException(DomainException):
    def __init__(self):
        super().__init__(
            message="El baneo no existe.",
            status_code=404,
        )
