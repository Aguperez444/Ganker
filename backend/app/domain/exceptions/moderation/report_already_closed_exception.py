from app.domain.exceptions.domain_exception import DomainException


class ReportAlreadyClosedException(DomainException):
    def __init__(self):
        super().__init__(
            message="La denuncia ya está cerrada.",
            status_code=409,
        )
