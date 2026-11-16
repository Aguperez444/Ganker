from app.domain.exceptions.domain_exception import DomainException


class BanRecordNotFoundException(DomainException):
    def __init__(self):
        super().__init__(
            message="El registro de baneo no existe.",
            status_code=404,
        )
