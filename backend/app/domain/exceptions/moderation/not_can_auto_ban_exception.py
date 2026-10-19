from app.domain.exceptions.domain_exception import DomainException


class NotCanAutoBanException(DomainException):
    def __init__(self):
        super().__init__(message="No puede auto banearse!! >=[", status_code=400)