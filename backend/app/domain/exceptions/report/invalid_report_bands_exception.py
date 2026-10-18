from app.domain.exceptions.domain_exception import DomainException


class InvalidReportBandsException(DomainException):
    def __init__(self, message: str):
        super().__init__(message, 400)
