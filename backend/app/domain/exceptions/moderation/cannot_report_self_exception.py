from app.domain.exceptions.domain_exception import DomainException


class CannotReportSelfException(DomainException):
    def __init__(self):
        super().__init__(message="No se puede reportar a uno mismo", status_code=400)