from app.domain.exceptions.domain_exception import DomainException


class PlayerReportNotFoundException(DomainException):
    def __init__(self):
        super().__init__(
            message="La denuncia no existe.",
            status_code=404,
        )
